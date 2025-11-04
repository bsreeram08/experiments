import { describe, it, expect } from '@jest/globals';
import { AsyncThrottle } from './async-throttle';
import { TimeoutError, TaskCancelledError, QueueFullError } from './errors';

describe('Sprint 1 Features', () => {
    describe('Global AbortController', () => {
        it('should expose signal property', () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });
            expect(throttle.signal).toBeDefined();
            expect(throttle.signal).toBeInstanceOf(AbortSignal);
        });

        it('should cancel tasks when cancelAll() is called', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                return 'should not complete';
            };

            const promise = throttle.addToQueue({ function: task, args: [] });

            setTimeout(() => throttle.cancelAll(), 100);

            const result = await promise;

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(TaskCancelledError);
        });
    });

    describe('Promise-based addToQueue', () => {
        it('should return TaskResult for successful tasks', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });

            const task = async (x: number, y: number) => x + y;

            const result = await throttle.addToQueue({
                function: task,
                args: [5, 10],
            });

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('value');
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('retries');
            expect(result.success).toBe(true);
            expect(result.value).toBe(15);
            expect(result.retries).toBe(0);
        });

        it('should return TaskResult for failed tasks', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });

            const task = async () => {
                throw new Error('Task failed');
            };

            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.message).toBe('Task failed');
        });

        it('should include metadata in result', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });

            const metadata = { userId: '123', operation: 'test' };
            const task = async () => 'done';

            const result = await throttle.addToQueue(
                { function: task, args: [] },
                undefined,
                0,
                { metadata }
            );

            expect(result.metadata).toEqual(metadata);
        });
    });

    describe('Timeout Support', () => {
        it('should timeout slow tasks', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
                defaultTimeout: 200,
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return 'should timeout';
            };

            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(TimeoutError);
        });

        it('should allow per-task timeout override', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
                defaultTimeout: 5000, // High global timeout
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return 'should timeout';
            };

            const result = await throttle.addToQueue(
                { function: task, args: [] },
                undefined,
                0,
                { timeout: 100 } // Low per-task timeout
            );

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(TimeoutError);
        });
    });

    describe('Retry Logic', () => {
        it('should retry failed tasks', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
                retry: {
                    attempts: 3,
                    strategy: 'exponential',
                    delay: 50,
                    maxDelay: 1000,
                    jitter: 'none',
                },
            });

            let attemptCount = 0;
            const task = async () => {
                attemptCount++;
                if (attemptCount < 2) {
                    throw new Error('Retry me');
                }
                return 'success';
            };

            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });

            expect(result.success).toBe(true);
            expect(result.value).toBe('success');
            expect(result.retries).toBeGreaterThan(0);
            expect(attemptCount).toBe(2);
        });

        it('should respect retry attempts limit', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
                retry: {
                    attempts: 2,
                    strategy: 'fixed',
                    delay: 10,
                    maxDelay: 1000,
                    jitter: 'none',
                },
            });

            let attemptCount = 0;
            const task = async () => {
                attemptCount++;
                throw new Error('Always fails');
            };

            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });

            expect(result.success).toBe(false);
            expect(attemptCount).toBeLessThanOrEqual(3); // Initial + 2 retries max
        });

        it('should use different retry strategies', async () => {
            const strategies: Array<
                'exponential' | 'linear' | 'fibonacci' | 'fixed'
            > = ['exponential', 'linear', 'fibonacci', 'fixed'];

            for (const strategy of strategies) {
                const throttle = new AsyncThrottle({
                    maxThreshold: 1,
                    delayExecutions: 100,
                    retry: {
                        attempts: 2,
                        strategy,
                        delay: 10,
                        maxDelay: 1000,
                        jitter: 'none',
                    },
                });

                let attempts = 0;
                const task = async () => {
                    attempts++;
                    if (attempts < 2) throw new Error('Retry');
                    return 'ok';
                };

                const result = await throttle.addToQueue({
                    function: task,
                    args: [],
                });
                expect(result.success).toBe(true);
            }
        });
    });

    describe('Backpressure', () => {
        it('should reject when queue is full with reject strategy', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 1000,
                maxQueueSize: 1,
                backpressureStrategy: 'reject',
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                return 'done';
            };

            // Fill queue
            void throttle.addToQueue({ function: task, args: [] });

            // Should be rejected
            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(QueueFullError);

            throttle.stop();
        });

        it('should drop oldest with drop-oldest strategy', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 500,
                maxQueueSize: 2,
                backpressureStrategy: 'drop-oldest',
            });

            const task = async (id: number) => {
                await new Promise((resolve) => setTimeout(resolve, 200));
                return `Task ${id}`;
            };

            // Quickly add multiple tasks
            void throttle.addToQueue({ function: task, args: [1] });
            void throttle.addToQueue({ function: task, args: [2] });
            const result3 = await throttle.addToQueue({
                function: task,
                args: [3],
            });

            // New task should be added (oldest might be dropped)
            expect(result3.success).toBe(true);

            throttle.stop();
        });
    });

    describe('Per-task Options', () => {
        it('should support per-task signal', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });
            const controller = new AbortController();

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return 'should be cancelled';
            };

            const promise = throttle.addToQueue(
                { function: task, args: [] },
                undefined,
                0,
                { signal: controller.signal }
            );

            setTimeout(() => controller.abort(), 100);

            const result = await promise;
            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(TaskCancelledError);
        });

        it('should support per-task retry override', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
                retry: {
                    attempts: 10,
                    strategy: 'fixed',
                    delay: 10,
                    maxDelay: 1000,
                    jitter: 'none',
                },
            });

            let attempts = 0;
            const task = async () => {
                attempts++;
                throw new Error('Always fails');
            };

            const result = await throttle.addToQueue(
                { function: task, args: [] },
                undefined,
                0,
                { retryAttempts: 1 } // Override to just 1 retry
            );

            expect(result.success).toBe(false);
            expect(attempts).toBeLessThanOrEqual(2); // Initial + 1 retry
        });
    });

    describe('Error Types', () => {
        it('should use TimeoutError for timeouts', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
                defaultTimeout: 100,
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return 'timeout';
            };

            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });
            expect(result.error).toBeInstanceOf(TimeoutError);
            if (result.error instanceof TimeoutError) {
                expect(result.error.timeout).toBe(100);
            }
        });

        it('should use TaskCancelledError for cancellations', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 100,
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return 'cancelled';
            };

            const promise = throttle.addToQueue({ function: task, args: [] });
            setTimeout(() => throttle.cancelAll(), 50);

            const result = await promise;
            expect(result.error).toBeInstanceOf(TaskCancelledError);
        });

        it('should use QueueFullError for backpressure rejections', async () => {
            const throttle = new AsyncThrottle({
                maxThreshold: 1,
                delayExecutions: 1000,
                maxQueueSize: 1,
                backpressureStrategy: 'reject',
            });

            const task = async () => {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                return 'done';
            };

            void throttle.addToQueue({ function: task, args: [] });
            const result = await throttle.addToQueue({
                function: task,
                args: [],
            });

            expect(result.error).toBeInstanceOf(QueueFullError);
            if (result.error instanceof QueueFullError) {
                expect(result.error.maxQueueSize).toBe(1);
            }

            throttle.stop();
        });
    });
});
