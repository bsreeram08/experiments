import { EventEmitter } from './event';
import { Queue } from './queue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TAny = any;
export type TAsyncThrottleFunction<TArgs extends Array<TAny>, TResponse> = {
    args: TArgs;
    function: (...args: TArgs) => Promise<TResponse>;
};

type TQueueItem = {
    method: () => (...args: Array<TAny>) => Promise<unknown>;
    args: Array<TAny>;
};

/**
 * The Constrained async options that controls the Queue
 */
type TConstrainedAsyncOptions = {
    maxThreshold: number;
    /**
     * MS in which each execution loop must wait to start the next one
     */
    delayExecutions: number;
};

type TEventEmitterEvents = {
    result: [{ value: TAny; id: string }];
    resultError: [{ error: Error; id: string }];
    empty: [];
    add: [];
    stop: [];
    clear: [];
    log: [string];
};
export class AsyncThrottle<T = TAny> {
    private queue: Queue<TQueueItem>;
    private ee: EventEmitter<TEventEmitterEvents>;
    private currentQueued: number;
    private destroy: boolean;

    on<T extends keyof TEventEmitterEvents>(
        event: T,
        handler: (...args: TEventEmitterEvents[T]) => void | Promise<void>
    ): void {
        this.ee.addListener(event, <never>handler);
    }

    constructor(private options: TConstrainedAsyncOptions) {
        this.queue = new Queue();
        this.currentQueued = 0;
        this.destroy = false;
        this.ee = new EventEmitter<TEventEmitterEvents>({
            captureRejections: false,
        });
        this.executeFunctions()
            .then(() => {
                this.ee.emit('log', `Execution complete`);
            })
            .catch((error) => {
                this.ee.emit(
                    'log',
                    `Error in executeFunctions: ${error.message}`
                );
                console.error(error);
            });
    }

    addToQueue<T extends TAsyncThrottleFunction<Array<TAny>, unknown>>(
        func: T,
        id: string = new Date().getTime().toString()
    ): void {
        this.queue.enQueue(
            { method: () => func.function, args: func.args },
            id
        );
        this.ee.emit('add');
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

    private async delay(): Promise<void> {
        await new Promise((res) => {
            setTimeout(() => {
                res(null);
            }, this.options.delayExecutions);
        });
    }

    private async executeFunctions(): Promise<void> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this.destroy) {
                this.ee.emit('log', 'Destroy called');
                break;
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
        try {
            const result = await item.method()(...item.args);
            this.ee.emit('result', { value: <T>result, id });
        } catch (e) {
            this.ee.emit(
                'log',
                `Error in functionExecutor: ${(<Error>e).message}`
            );
            this.ee.emit('resultError', { id, error: <Error>e });
        }
        this.currentQueued--;
    }

    stop(): void {
        this.destroy = true;
        this.ee.emit('stop');
    }
}
