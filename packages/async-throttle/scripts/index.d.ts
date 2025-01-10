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
    emit(event: K, ...args: T[K]): boolean;
}
export class Queue<T> {
    private head?;
    private tail?;
    private _size;
    get size(): number;
    enQueue(value: T, id: string): void;
    deQueue():
        | {
              value: T;
              id: string;
          }
        | undefined;
    peek(): T | undefined;
    clear(): void;
}
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
type TEventEmitterEvents = {
    result: [
        {
            value: TAny;
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
};
export class AsyncThrottle<T = TAny> {
    private options;
    private queue;
    private ee;
    private currentQueued;
    private destroy;
    on<T extends keyof TEventEmitterEvents>(
        event: T,
        handler: (...args: TEventEmitterEvents[T]) => void | Promise<void>
    ): void;
    constructor(options: TConstrainedAsyncOptions);
    addToQueue<T extends TAsyncThrottleFunction<Array<TAny>, unknown>>(
        func: T,
        id?: string
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
}
