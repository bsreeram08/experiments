export class EventEmitter<
    const T extends Record<string, Array<unknown>>,
    const K extends keyof T = keyof T
> {
    private listeners;
    private captureRejections;
    constructor(options: { captureRejections: boolean });
    addListener(
        event: K,
        listener: (...args: T[K]) => void | Promise<void>
    ): this;
    removeListener(
        event: K,
        listener: (...args: T[K]) => void | Promise<void>
    ): this;
    removeAllListeners(event?: K): this;
    listenerCount(event: K): number;
    emit(event: K, ...args: T[K]): boolean;
}
export class Queue<T> {
    private head?;
    private tail?;
    private _size;
    get size(): number;
    enQueue(value: T, id: string, priority?: number): void;
    deQueue():
        | {
              value: T;
              id: string;
          }
        | undefined;
    peek(): T | undefined;
    clear(): void;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TAny = any;
export type TAsyncThrottleFunction<TArgs extends Array<TAny>, TResponse> = {
    args: TArgs;
    function: (...args: TArgs) => Promise<TResponse>;
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
type TEventEmitterEvents<T = TAny> = {
    result: [
        {
            value: T;
            id: string;
        }
    ];
    resultError: [
        {
            error: Error;
            id: string;
        }
    ];
    empty: [];
    add: [];
    stop: [];
    clear: [];
    log: [string];
    pause: [];
    resume: [];
};
export class AsyncThrottle<T = TAny> {
    private options;
    private queue;
    private ee;
    private currentQueued;
    private destroy;
    private paused;
    on<E extends keyof TEventEmitterEvents<T>>(
        event: E,
        handler: (...args: TEventEmitterEvents<T>[E]) => void | Promise<void>
    ): void;
    off<E extends keyof TEventEmitterEvents<T>>(
        event: E,
        handler: (...args: TEventEmitterEvents<T>[E]) => void | Promise<void>
    ): void;
    removeAllListeners<E extends keyof TEventEmitterEvents<T>>(event?: E): void;
    constructor(options: TConstrainedAsyncOptions);
    addToQueue<TFunc extends TAsyncThrottleFunction<Array<TAny>, unknown>>(
        func: TFunc,
        id?: string,
        priority?: number
    ): void;
    get currentStatus(): {
        queueSize: number;
        currentlyQueued: number;
        maxThreshold: number;
    };
    clearQueue(): void;
    private delay;
    private executeFunctions;
    private functionExecutor;
    stop(): void;
    pause(): void;
    resume(): void;
    get isPaused(): boolean;
}
