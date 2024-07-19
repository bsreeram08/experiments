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
