import type { RetryStrategy, JitterStrategy } from './types';

const retryCallbacks = new Map<
    string,
    (attempt: number, baseDelay: number) => number
>();
retryCallbacks.set('exponential', (attempt: number, baseDelay: number) => {
    return baseDelay * Math.pow(2, attempt);
});
retryCallbacks.set('linear', (attempt: number, baseDelay: number) => {
    return baseDelay * (attempt + 1);
});
retryCallbacks.set('fibonacci', (attempt: number, baseDelay: number) => {
    const fib = fibonacci(attempt + 1);
    return baseDelay * fib;
});
retryCallbacks.set('fixed', (_attempt: number, baseDelay: number) => {
    return baseDelay;
});

/**
 * Calculate delay for retry attempt with strategy and jitter
 */
export function calculateRetryDelay(
    attempt: number,
    baseDelay: number,
    strategy: RetryStrategy,
    jitter: JitterStrategy,
    maxDelay: number
): number {
    let delay = 0;
    const callback = retryCallbacks.get(strategy);
    if (callback) {
        delay = callback(attempt, baseDelay);
    } else {
        delay = baseDelay;
    }

    // Apply jitter
    delay = applyJitter(delay, jitter);

    // Cap at max delay
    return Math.min(delay, maxDelay);
}

const jitterCallbacks = new Map<string, (delay: number) => number>();
jitterCallbacks.set('full', (delay: number) => {
    return Math.random() * delay;
});
jitterCallbacks.set('equal', (delay: number) => {
    return delay / 2 + Math.random() * (delay / 2);
});
jitterCallbacks.set('decorrelated', (delay: number) => {
    return Math.random() * delay * 3;
});
jitterCallbacks.set('none', (delay: number) => {
    return delay;
});

/**
 * Apply jitter to delay
 */
function applyJitter(delay: number, strategy: JitterStrategy): number {
    const callback = jitterCallbacks.get(strategy);
    if (callback) {
        return callback(delay);
    }
    return delay;
}

/**
 * Calculate nth Fibonacci number efficiently
 */
function fibonacci(n: number): number {
    if (n <= 1) return n;
    let a = 0,
        b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

/**
 * Create a timeout promise that rejects after specified ms
 */
export function createTimeoutPromise(
    ms: number,
    taskId: string
): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Task ${taskId} timed out after ${ms}ms`));
        }, ms);
    });
}

/**
 * Check if an AbortSignal is aborted
 */
export function checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new Error(
            `Task cancelled: ${signal.reason || 'No reason provided'}`
        );
    }
}
