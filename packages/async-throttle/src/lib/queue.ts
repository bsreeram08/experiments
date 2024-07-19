type TQueueNode<T> = {
    item: T;
    id: string;
    next?: TQueueNode<T>;
};

export class Queue<T> {
    private head?: TQueueNode<T>;
    private tail?: TQueueNode<T>;
    private _size = 0;

    get size(): number {
        return this._size;
    }

    enQueue(value: T, id: string): void {
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
    deQueue():
        | {
              value: T;
              id: string;
          }
        | undefined {
        this._size--;
        if (this.head) {
            const value = this.head.item;
            const id = this.head.id;
            this.head = this.head.next;
            return { value, id };
        }
        return undefined;
    }

    peek(): T | undefined {
        return this.head?.item;
    }

    clear(): void {
        this._size = 0;
        this.head = this.tail = undefined;
    }
}
