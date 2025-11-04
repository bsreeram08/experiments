export class EventEmitter<
    const T extends Record<string, Array<unknown>>,
    const K extends keyof T = keyof T
> {
    private listeners: Record<K, Array<(...args: Array<unknown>) => void>> = <
        never
    >{};

    private captureRejections: boolean;

    constructor(options: { captureRejections: boolean }) {
        this.captureRejections = options.captureRejections;
    }

    addListener(
        event: K,
        listener: (...args: T[K]) => void | Promise<void>
    ): this {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(
            listener as (...args: Array<unknown>) => void
        );
        return this;
    }

    removeListener(
        event: K,
        listener: (...args: T[K]) => void | Promise<void>
    ): this {
        if (!this.listeners[event]) {
            return this;
        }
        const index = this.listeners[event].indexOf(
            listener as (...args: Array<unknown>) => void
        );
        if (index !== -1) {
            this.listeners[event].splice(index, 1);
        }
        return this;
    }

    removeAllListeners(event?: K): this {
        if (event) {
            delete this.listeners[event];
        } else {
            this.listeners = <never>{};
        }
        return this;
    }

    listenerCount(event: K): number {
        return this.listeners[event]?.length ?? 0;
    }

    emit(event: K, ...args: T[K]): boolean {
        if (!this.listeners[event]) {
            return false;
        }
        const listeners = this.listeners[event];
        for (const listener of listeners) {
            if (this.captureRejections) {
                Promise.resolve(listener(...args)).catch((error) => {
                    console.error(error);
                });
            } else {
                listener(...args);
            }
        }
        return true;
    }
}
