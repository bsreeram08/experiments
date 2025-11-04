/**
 * Error thrown when a task exceeds its timeout
 */
export class TimeoutError extends Error {
    constructor(public taskId: string, public timeout: number) {
        super(`Task ${taskId} timed out after ${timeout}ms`);
        this.name = 'TimeoutError';
    }
}

/**
 * Error thrown when a task is cancelled via AbortSignal
 */
export class TaskCancelledError extends Error {
    constructor(public taskId: string, public reason?: string) {
        super(`Task ${taskId} was cancelled${reason ? `: ${reason}` : ''}`);
        this.name = 'TaskCancelledError';
    }
}

/**
 * Error thrown when queue is full and backpressure strategy is 'reject'
 */
export class QueueFullError extends Error {
    constructor(public maxQueueSize: number) {
        super(`Queue is full (max: ${maxQueueSize})`);
        this.name = 'QueueFullError';
    }
}
