import type { BackpressureStrategy } from './types';
import { QueueFullError } from './errors';

type TQueueNode<T> = {
    item: T;
    id: string;
    priority: number; // Higher number = higher priority
    next?: TQueueNode<T>;
};

/**
 * A simple priority queue implementation
 */

export class Queue<T> {
    private head?: TQueueNode<T>;
    private tail?: TQueueNode<T>;
    private _size = 0;
    private maxSize: number;
    private backpressureStrategy: BackpressureStrategy;

    constructor(
        maxSize = 0,
        backpressureStrategy: BackpressureStrategy = 'reject'
    ) {
        this.maxSize = maxSize;
        this.backpressureStrategy = backpressureStrategy;
    }

    get size(): number {
        return this._size;
    }

    get isFull(): boolean {
        return this.maxSize > 0 && this._size >= this.maxSize;
    }

    enQueue(value: T, id: string, priority = 0): void {
        // Handle backpressure
        if (this.isFull) {
            switch (this.backpressureStrategy) {
                case 'reject':
                    throw new QueueFullError(this.maxSize);
                case 'drop-oldest':
                    // Remove oldest (lowest priority) item
                    this.deQueue();
                    break;
                case 'block':
                    // This will be handled at a higher level with async/await
                    throw new QueueFullError(this.maxSize);
            }
        }

        this._size++;
        const node: TQueueNode<T> = {
            item: value,
            id,
            priority,
            next: undefined,
        };

        // If queue is empty or priority is less than or equal to tail priority, add to end
        if (!this.head || (this.tail && priority <= this.tail.priority)) {
            if (this.head) {
                if (this.tail) this.tail.next = node;
                this.tail = node;
            } else {
                this.head = node;
                this.tail = node;
            }
        } else {
            // Insert in priority order (higher priority towards head)
            // If new node has higher priority than head, insert at head
            if (priority > this.head.priority) {
                node.next = this.head;
                this.head = node;
            } else {
                // Find the correct position to insert
                let current = this.head;
                while (current.next && current.next.priority >= priority) {
                    current = current.next;
                }
                node.next = current.next;
                current.next = node;

                // Update tail if we inserted at the end
                if (!node.next) {
                    this.tail = node;
                }
            }
        }
    }
    deQueue():
        | {
              value: T;
              id: string;
          }
        | undefined {
        if (this.head) {
            this._size--;
            const value = this.head.item;
            const id = this.head.id;
            this.head = this.head.next;
            if (!this.head) {
                this.tail = undefined;
            }
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
