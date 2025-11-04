import { EventEmitter } from './event';
import { Queue } from './queue';
import { TimeoutError, TaskCancelledError } from './errors';
import { calculateRetryDelay, checkAborted } from './retry-utils';
import {
    MetricsCollector,
    type Metrics,
    type LatencyHistogramConfig,
} from './metrics';
import type {
    TAny,
    TAsyncThrottleFunction,
    TConstrainedAsyncOptions,
    PerTaskOptions,
    TaskResult,
    TQueueItem,
    RetryConfig,
} from './types';

export type {
    TAsyncThrottleFunction,
    PerTaskOptions,
    TaskResult,
    TConstrainedAsyncOptions,
    Metrics,
    LatencyHistogramConfig,
};

type TEventEmitterEvents<T = TAny> = {
    result: [TaskResult<T>];
    resultError: [TaskResult<T>];
    empty: [];
    add: [];
    stop: [];
    clear: [];
    log: [string];
    pause: [];
    resume: [];
    taskCancelled: [{ id: string; reason?: string }];
    taskTimeout: [{ id: string; timeout: number }];
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    attempts: 0,
    delay: 1000,
    strategy: 'exponential',
    jitter: 'full',
    maxDelay: 30000,
};

export class AsyncThrottle<T = TAny> {
    private queue: Queue<TQueueItem>;
    private ee: EventEmitter<TEventEmitterEvents<T>>;
    private currentQueued: number;
    private destroy: boolean;
    private paused: boolean;
    private globalAbortController: AbortController;
    private retryConfig: RetryConfig;
    private defaultTimeout?: number;
    private metrics: MetricsCollector;
    private taskHashes: Set<string> = new Set();
    private deduplicationEnabled: boolean;
    private hashFunction: (
        task: TAsyncThrottleFunction<Array<TAny>, unknown>
    ) => string;

    on<E extends keyof TEventEmitterEvents<T>>(
        event: E,
        handler: (...args: TEventEmitterEvents<T>[E]) => void | Promise<void>
    ): void {
        this.ee.addListener(event, <never>handler);
    }

    off<E extends keyof TEventEmitterEvents<T>>(
        event: E,
        handler: (...args: TEventEmitterEvents<T>[E]) => void | Promise<void>
    ): void {
        this.ee.removeListener(event, <never>handler);
    }

    removeAllListeners<E extends keyof TEventEmitterEvents<T>>(
        event?: E
    ): void {
        this.ee.removeAllListeners(event);
    }

    /**
     * Get the global AbortSignal for cancelling all tasks
     */
    get signal(): AbortSignal {
        return this.globalAbortController.signal;
    }

    constructor(private options: TConstrainedAsyncOptions) {
        this.queue = new Queue<TQueueItem>(
            options.maxQueueSize || 0,
            options.backpressureStrategy || 'reject'
        );
        this.currentQueued = 0;
        this.destroy = false;
        this.paused = false;
        this.globalAbortController = new AbortController();
        this.retryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            ...options.retry,
        };
        this.defaultTimeout = options.defaultTimeout;
        this.metrics = new MetricsCollector(options.metricsConfig);
        this.deduplicationEnabled = options.enableDeduplication || false;
        this.hashFunction =
            options.deduplicationHashFn || this.defaultHashFunction;
        this.ee = new EventEmitter<TEventEmitterEvents<T>>({
            captureRejections: false,
        });
        this.executeFunctions()
            .then(() => {
                this.ee.emit('log', `Execution complete`);
            })
            .catch((error: Error) => {
                this.ee.emit(
                    'log',
                    `Error in executeFunctions: ${error.message}`
                );
                console.error(error);
            });
    }

    async addToQueue<
        TFunc extends TAsyncThrottleFunction<Array<TAny>, unknown>
    >(
        func: TFunc,
        id: string = new Date().getTime().toString(),
        priority = 0,
        options: PerTaskOptions = {}
    ): Promise<TaskResult<T>> {
        // Check for duplicate if deduplication is enabled
        let deduplicationHash: string | undefined;
        if (this.deduplicationEnabled) {
            const hash = this.hashFunction(func);
            if (this.taskHashes.has(hash)) {
                this.ee.emit('log', `Duplicate task detected: ${hash}`);
                // Return a rejected task result instead of queuing
                return {
                    id,
                    success: false,
                    error: new Error('Duplicate task'),
                    retries: 0,
                    duration: 0,
                    metadata: options.metadata,
                } as TaskResult<T>;
            }
            this.taskHashes.add(hash);
            deduplicationHash = hash;
        }

        return new Promise((resolve, reject) => {
            try {
                const queueItem: TQueueItem = {
                    method: () => func.function,
                    args: func.args,
                    options: {
                        ...options,
                        metadata: options.metadata || {},
                    },
                    resolve,
                    reject,
                    deduplicationHash,
                };

                this.queue.enQueue(queueItem, id, priority);
                this.metrics.taskAdded();
                this.ee.emit('add');
            } catch (error) {
                // Handle queue full or other errors
                reject(error);
            }
        });
    }

    private defaultHashFunction(
        task: TAsyncThrottleFunction<Array<TAny>, unknown>
    ): string {
        try {
            // Create a hash from function name and arguments
            const fnName = task.function.name || 'anonymous';
            const argsStr = JSON.stringify(task.args);
            return `${fnName}:${argsStr}`;
        } catch {
            // Fallback if JSON.stringify fails
            return `${task.function.toString()}:${task.args.length}`;
        }
    }

    get currentStatus(): {
        queueSize: number;
        currentlyQueued: number;
        maxThreshold: number;
    } {
        return {
            queueSize: this.queue.size,
            currentlyQueued: this.currentQueued,
            maxThreshold: this.options.maxThreshold,
        };
    }

    clearQueue(): void {
        this.queue.clear();
        this.ee.emit('clear');
    }

    private async executeFunctions(): Promise<void> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this.destroy) {
                this.ee.emit('log', 'Destroy called');
                break;
            }
            if (this.paused) {
                this.ee.emit('log', 'Paused, waiting...');
                await this.delay();
                continue;
            }
            if (
                this.currentQueued < this.options.maxThreshold &&
                this.queue.size !== 0
            ) {
                this.ee.emit('log', 'Called to execute');
                const batch: Array<() => Promise<void>> = [];
                for (
                    let i = 0;
                    i < this.options.maxThreshold && this.queue.size > 0;
                    i++
                ) {
                    this.currentQueued++;
                    const func = this.queue.deQueue();
                    if (func)
                        batch.push(() =>
                            this.functionExecutor(func.value, func.id)
                        );
                }
                await Promise.all(batch.map((v) => v()));
            } else {
                this.ee.emit('empty');
                this.ee.emit('log', 'Nothing to do');
            }
            this.ee.emit(
                'log',
                `CONSTRAINED_ASYNC: Queue Size -> ${this.queue.size}`
            );
            this.ee.emit(
                'log',
                `CONSTRAINED_ASYNC: CurrentQueue Size -> ${this.currentQueued}`
            );
            await this.delay();
        }
    }

    private async functionExecutor(
        item: TQueueItem,
        id: string
    ): Promise<void> {
        const startTime = Date.now();
        let retries = 0;

        // Mark task as started
        this.metrics.taskStarted();

        const taskOptions = item.options;
        const maxRetries =
            taskOptions.retryAttempts ?? this.retryConfig.attempts;
        const retryDelay = taskOptions.retryDelay ?? this.retryConfig.delay;
        const timeout = taskOptions.timeout ?? this.defaultTimeout;

        // Combine global and task-specific abort signals
        const signals = [this.globalAbortController.signal];
        if (taskOptions.signal) {
            signals.push(taskOptions.signal);
        }
        const combinedSignal =
            AbortSignal.any?.(signals) ||
            taskOptions.signal ||
            this.globalAbortController.signal;

        const executeWithRetry = async (): Promise<T> => {
            while (retries <= maxRetries) {
                try {
                    // Check if cancelled
                    checkAborted(combinedSignal);

                    // Create task promise
                    const taskPromise = item.method()(...item.args);

                    // Apply timeout if specified
                    const result = timeout
                        ? await Promise.race([
                              taskPromise,
                              this.createTimeoutPromise(timeout, id),
                          ])
                        : await taskPromise;

                    return result as T;
                } catch (error) {
                    // Check if it's a cancellation or timeout
                    if (combinedSignal?.aborted) {
                        throw new TaskCancelledError(id, combinedSignal.reason);
                    }

                    if (error instanceof TimeoutError) {
                        if (timeout) {
                            this.ee.emit('taskTimeout', { id, timeout });
                        }
                        if (retries < maxRetries) {
                            retries++;
                            const delay = calculateRetryDelay(
                                retries - 1,
                                retryDelay,
                                taskOptions.retryStrategy ||
                                    this.retryConfig.strategy,
                                taskOptions.jitterStrategy ||
                                    this.retryConfig.jitter,
                                taskOptions.maxRetryDelay ||
                                    this.retryConfig.maxDelay
                            );
                            await this.delay(delay);
                            continue;
                        }
                        throw error;
                    }

                    // Regular error - retry if applicable
                    if (retries < maxRetries) {
                        retries++;
                        const delay = calculateRetryDelay(
                            retries - 1,
                            retryDelay,
                            taskOptions.retryStrategy ||
                                this.retryConfig.strategy,
                            taskOptions.jitterStrategy ||
                                this.retryConfig.jitter,
                            taskOptions.maxRetryDelay ||
                                this.retryConfig.maxDelay
                        );
                        this.ee.emit(
                            'log',
                            `Retrying task ${id} (attempt ${retries}/${maxRetries}) after ${delay}ms`
                        );
                        await this.delay(delay);
                    } else {
                        throw error;
                    }
                }
            }
            throw new Error('Max retries exceeded');
        };

        try {
            const result = await executeWithRetry();
            const duration = Date.now() - startTime;

            const taskResult: TaskResult<T> = {
                id,
                value: result,
                success: true,
                retries,
                duration,
                metadata: taskOptions.metadata,
            };

            this.metrics.taskSucceeded(duration);
            this.ee.emit('result', taskResult);
            item.resolve(taskResult);
        } catch (e) {
            const duration = Date.now() - startTime;
            const error = e as Error;

            this.ee.emit('log', `Error in functionExecutor: ${error.message}`);

            const taskResult: TaskResult<T> = {
                id,
                error,
                success: false,
                retries,
                duration,
                metadata: taskOptions.metadata,
            };

            // Update metrics based on error type
            if (error instanceof TaskCancelledError) {
                this.metrics.taskCancelled(duration);
                this.ee.emit('taskCancelled', { id, reason: error.reason });
            } else if (error instanceof TimeoutError) {
                this.metrics.taskTimedOut(duration);
            } else {
                this.metrics.taskFailed(duration);
            }

            this.ee.emit('resultError', taskResult);
            item.resolve(taskResult); // Always resolve, not reject
        } finally {
            // Clean up deduplication hash after task completes
            if (item.deduplicationHash) {
                this.taskHashes.delete(item.deduplicationHash);
            }
        }
        this.currentQueued--;
    }

    private createTimeoutPromise(ms: number, taskId: string): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new TimeoutError(taskId, ms));
            }, ms);
        });
    }

    private async delay(ms?: number): Promise<void> {
        const delayTime = ms ?? this.options.delayExecutions;
        await new Promise((res) => {
            setTimeout(() => {
                res(null);
            }, delayTime);
        });
    }

    stop(): void {
        this.destroy = true;
        this.ee.emit('stop');
    }

    cancelAll(reason?: string): void {
        this.globalAbortController.abort(reason);
        this.ee.emit(
            'log',
            `All tasks cancelled: ${reason || 'No reason provided'}`
        );
    }

    pause(): void {
        if (!this.paused) {
            this.paused = true;
            this.ee.emit('pause');
            this.ee.emit('log', 'Execution paused');
        }
    }

    resume(): void {
        if (this.paused) {
            this.paused = false;
            this.ee.emit('resume');
            this.ee.emit('log', 'Execution resumed');
        }
    }

    get isPaused(): boolean {
        return this.paused;
    }

    /**
     * Get current metrics snapshot
     */
    getMetrics(): Metrics {
        return this.metrics.getMetrics();
    }

    /**
     * Reset all metrics
     */
    resetMetrics(): void {
        this.metrics.reset();
    }

    /**
     * Add multiple tasks at once
     * @param tasks Array of tasks to add
     * @param baseId Base ID for tasks (will be suffixed with index)
     * @param basePriority Base priority for all tasks
     * @param options Options to apply to all tasks
     * @returns Promise that resolves when all tasks are added (not completed)
     */
    async addMany<TFunc extends TAsyncThrottleFunction<Array<TAny>, unknown>>(
        tasks: TFunc[],
        baseId?: string,
        basePriority = 0,
        options: PerTaskOptions = {}
    ): Promise<void> {
        const promises = tasks.map((task, index) => {
            const id = baseId ? `${baseId}-${index}` : undefined;
            return this.addToQueue(task, id, basePriority, options);
        });
        // Return when all are queued, not when they complete
        await Promise.allSettled(promises);
    }

    /**
     * Wait until the queue is empty
     * @param timeout Optional timeout in ms
     * @returns Promise that resolves when queue is empty or rejects on timeout
     */
    async flush(timeout?: number): Promise<void> {
        const startTime = Date.now();

        while (this.queue.size > 0 || this.currentQueued > 0) {
            if (timeout && Date.now() - startTime > timeout) {
                throw new Error(`Flush timeout after ${timeout}ms`);
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    /**
     * Stop accepting new tasks and wait for active tasks to complete
     * @param timeout Optional timeout in ms
     * @returns Promise that resolves when all active tasks complete
     */
    async drain(timeout?: number): Promise<void> {
        this.destroy = true; // Stop accepting new tasks from the execution loop
        const startTime = Date.now();

        // Wait for all active tasks to complete
        while (this.currentQueued > 0) {
            if (timeout && Date.now() - startTime > timeout) {
                throw new Error(`Drain timeout after ${timeout}ms`);
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    /**
     * Schedule a task to execute at a specific date/time
     * @param task The task to schedule
     * @param executeAt When to execute the task
     * @param id Optional task ID
     * @param priority Task priority
     * @param options Per-task options
     * @returns Promise that resolves with task result
     */
    async scheduleAt<
        TFunc extends TAsyncThrottleFunction<Array<TAny>, unknown>
    >(
        task: TFunc,
        executeAt: Date,
        id?: string,
        priority = 0,
        options: PerTaskOptions = {}
    ): Promise<TaskResult<T>> {
        const delay = executeAt.getTime() - Date.now();
        if (delay <= 0) {
            // Execute immediately if time has passed
            return this.addToQueue(task, id, priority, options);
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.addToQueue(task, id, priority, options)
                    .then(resolve)
                    .catch(reject);
            }, delay);
        });
    }

    /**
     * Schedule a task to execute after a delay
     * @param task The task to schedule
     * @param delayMs Delay in milliseconds
     * @param id Optional task ID
     * @param priority Task priority
     * @param options Per-task options
     * @returns Promise that resolves with task result
     */
    async scheduleIn<
        TFunc extends TAsyncThrottleFunction<Array<TAny>, unknown>
    >(
        task: TFunc,
        delayMs: number,
        id?: string,
        priority = 0,
        options: PerTaskOptions = {}
    ): Promise<TaskResult<T>> {
        if (delayMs <= 0) {
            return this.addToQueue(task, id, priority, options);
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.addToQueue(task, id, priority, options)
                    .then(resolve)
                    .catch(reject);
            }, delayMs);
        });
    }
}
