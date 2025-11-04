// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TAny = any;

export type TAsyncThrottleFunction<TArgs extends Array<TAny>, TResponse> = {
    args: TArgs;
    function: (...args: TArgs) => Promise<TResponse>;
};

/**
 * Retry strategy for failed tasks
 */
export type RetryStrategy = 'exponential' | 'linear' | 'fibonacci' | 'fixed';

/**
 * Jitter strategy to prevent thundering herd
 */
export type JitterStrategy = 'full' | 'decorrelated' | 'equal' | 'none';

/**
 * Backpressure strategy when queue is full
 */
export type BackpressureStrategy = 'reject' | 'drop-oldest' | 'block';

/**
 * Log level for task-specific logging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Per-task options that override global settings
 */
export interface PerTaskOptions {
    /** AbortSignal to cancel this specific task */
    signal?: AbortSignal;

    /** Number of retry attempts (overrides global) */
    retryAttempts?: number;

    /** Delay between retries in ms (overrides global) */
    retryDelay?: number;

    /** Retry strategy (overrides global) */
    retryStrategy?: RetryStrategy;

    /** Jitter strategy for retries (overrides global) */
    jitterStrategy?: JitterStrategy;

    /** Maximum delay for retries in ms */
    maxRetryDelay?: number;

    /** Task-specific timeout in ms */
    timeout?: number;

    /** Log level for this task */
    logLevel?: LogLevel;

    /** Task metadata for tracking */
    metadata?: Record<string, unknown>;
}

/**
 * Global retry configuration
 */
export interface RetryConfig {
    /** Number of retry attempts */
    attempts: number;

    /** Base delay between retries in ms */
    delay: number;

    /** Retry strategy */
    strategy: RetryStrategy;

    /** Jitter strategy */
    jitter: JitterStrategy;

    /** Maximum delay for retries in ms */
    maxDelay: number;
}

/**
 * The Constrained async options that controls the Queue
 */
export interface TConstrainedAsyncOptions {
    /** Maximum number of concurrent tasks */
    maxThreshold: number;

    /** MS in which each execution loop must wait to start the next one */
    delayExecutions: number;

    /** Maximum queue size (0 = unlimited) */
    maxQueueSize?: number;

    /** Backpressure strategy when queue is full */
    backpressureStrategy?: BackpressureStrategy;

    /** Global retry configuration */
    retry?: Partial<RetryConfig>;

    /** Default timeout for tasks in ms */
    defaultTimeout?: number;

    /** Global log level */
    logLevel?: LogLevel;

    /** Metrics collection configuration */
    metricsConfig?: {
        /** Custom histogram buckets in milliseconds */
        buckets: number[];
    };

    /** Enable task deduplication */
    enableDeduplication?: boolean;

    /** Custom hash function for deduplication (default: JSON.stringify) */
    deduplicationHashFn?: (
        task: TAsyncThrottleFunction<Array<TAny>, unknown>
    ) => string;
}

/**
 * Result of a task execution
 */
export interface TaskResult<T = TAny> {
    /** Task ID */
    id: string;

    /** Task result value (if successful) */
    value?: T;

    /** Error (if failed) */
    error?: Error;

    /** Whether task succeeded */
    success: boolean;

    /** Number of retry attempts made */
    retries: number;

    /** Task duration in ms */
    duration: number;

    /** Task metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Internal queue item with all metadata
 */
export interface TQueueItem {
    method: () => (...args: Array<TAny>) => Promise<unknown>;
    args: Array<TAny>;
    options: PerTaskOptions;
    resolve: (result: TaskResult) => void;
    reject: (error: Error) => void;
    deduplicationHash?: string;
}
