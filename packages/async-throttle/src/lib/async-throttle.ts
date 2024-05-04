type ConstrainedSuccessCallback<T> = (result: {
    value: T;
    id: string;
}) => Promise<void>;
type ConstrainedFailedCallback = (error: Error) => void;
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
type TConstrainedAsyncOptions<T> = {
    completionCallback: ConstrainedSuccessCallback<T>;
    failedCallback: ConstrainedFailedCallback;
    maxThreshold: number;
    /**
     * MS in which each execution loop must wait to start the next one
     */
    delayExecutions: number;
    loggingFunction: (message: string) => void;
};
export class AsyncThrottle<T = TAny> {
    private queue: Queue<TQueueItem>;
    private currentQueued: number;
    private destroy: boolean;
    constructor(private options: TConstrainedAsyncOptions<T>) {
        this.queue = new Queue();
        this.currentQueued = 0;
        this.destroy = false;
        this.executeFunctions()
            .then(() => {
                this.options.loggingFunction(`Execution complete`);
            })
            .catch((error) => {
                this.options.loggingFunction(
                    `Error in executeFunctions: ${error.message}`
                );
                console.error(error);
            });
    }

    addToQueue<T extends TAsyncThrottleFunction<Array<TAny>, unknown>>(
        func: T
    ): void {
        this.queue.enQueue({ method: () => func.function, args: func.args });
    }

    get currentStatus() {
        return {
            queueSize: this.queue.size,
            currentlyQueued: this.currentQueued,
            maxThreshold: this.options.maxThreshold,
        };
    }

    clearQueue() {
        this.queue.clear();
    }

    private async executeFunctions(): Promise<void> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this.destroy) {
                this.options.loggingFunction('Destroy called');
                break;
            }
            if (
                this.currentQueued < this.options.maxThreshold &&
                this.queue.size !== 0
            ) {
                this.options.loggingFunction('Called to execute');
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
                this.options.loggingFunction('Nothing to do');
                await new Promise((res) => {
                    setTimeout(() => {
                        res(null);
                    }, this.options.delayExecutions);
                });
            }
            this.options.loggingFunction(
                `CONSTRAINED_ASYNC: Queue Size -> ${this.queue.size}`
            );
            this.options.loggingFunction(
                `CONSTRAINED_ASYNC: CurrentQueue Size -> ${this.currentQueued}`
            );
        }
    }

    private async functionExecutor(item: TQueueItem, id: string) {
        try {
            const result = await item.method()(...item.args);
            this.options.completionCallback({ value: <T>result, id: id });
        } catch (e) {
            this.options.loggingFunction(
                `Error in functionExecutor: ${(<Error>e).message}`
            );
            this.options.failedCallback(<Error>e);
        }
        this.currentQueued--;
    }

    stop() {
        this.destroy = true;
    }
}

type TQueueNode<T> = {
    item: T;
    id: string;
    next?: TQueueNode<T>;
};

class Queue<T> {
    private head?: TQueueNode<T>;
    private tail?: TQueueNode<T>;
    private _size = 0;

    get size() {
        return this._size;
    }

    enQueue(value: T, id: string = new Date().getTime().toString()) {
        this._size++;
        const node: TQueueNode<T> = {
            item: value,
            id,
            next: undefined,
        };
        if (this.head) {
            if (this.tail) this.tail.next = node;
            this.tail = node;
        } else {
            this.head = node;
            this.tail = node;
        }
    }
    deQueue() {
        this._size--;
        if (this.head) {
            const value = this.head.item;
            const id = this.head.id;
            this.head = this.head.next;
            return { value, id };
        }
        return undefined;
    }

    peek() {
        return this.head?.item;
    }

    clear() {
        this._size = 0;
        this.head = this.tail = undefined;
    }
}
