import { generateID } from '@jetit/id';
import { AsyncThrottle, TAsyncThrottleFunction } from './async-throttle';
import { EventEmitter } from './event';

describe('constrainedAsync', () => {
    it('should work', async () => {
        const cs = new AsyncThrottle<unknown>({
            maxThreshold: 5,
            delayExecutions: 1000,
        });

        cs.on('log', (message) => console.log(`LOG: ${message}`));
        cs.on('result', (res) => console.log(`RESULT: ${JSON.stringify(res)}`));
        cs.on('resultError', (res) =>
            console.log(`RESULT_ERROR: ${JSON.stringify(res)}`)
        );
        cs.on('empty', () => {
            cs.stop();
        });
        for (let i = 0; i < 1000; i++) {
            console.log(`ADDED ${i + 1}`);
            cs.addToQueue(
                {
                    args: ['100', 10],
                    function: async (num, str) => {
                        return {
                            hello: `${num} ${str}`,
                        };
                    },
                },
                generateID('HEX')
            );
        }

        await new Promise((res) => {
            setTimeout(() => {
                console.log('Called destroy');
                res(null);
                process.exit(0);
            }, 500000);
        });
    }, 500000);

    it('battle test', async () => {
        // Async function to simulate a task
        const simulateTask = async (
            taskId: number,
            delay: number
        ): Promise<string> => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return `Task ${taskId} completed`;
        };

        // Create an instance of ConstrainedAsync with desired options
        const constrainedAsync = new AsyncThrottle({
            maxThreshold: 3,
            delayExecutions: 1000,
        });

        constrainedAsync.on('result', async (result) => {
            console.log(`Task completed [${result.id}] : ${result.value}`);
        });
        constrainedAsync.on('resultError', async (result) => {
            console.error(
                `Task failed [${result.id}] : ${result.error?.message}`
            );
        });
        constrainedAsync.on('log', (message) => {
            console.log(`[LOG] ${message}`);
        });
        constrainedAsync.on('stop', () => {
            // close all the things that has to be closed
        });

        // Create an array of tasks to be added to the queue
        const tasks: TAsyncThrottleFunction<[number, number], string>[] = [
            { args: [1, 2000], function: simulateTask },
            { args: [2, 1500], function: simulateTask },
            { args: [3, 1000], function: simulateTask },
            { args: [4, 500], function: simulateTask },
            { args: [5, 1000], function: simulateTask },
            { args: [6, 1500], function: simulateTask },
        ];

        // Add tasks to the queue
        tasks.forEach((task) => {
            constrainedAsync.addToQueue(task);
        });

        // Log the current status of the queue
        console.log('Initial status:', constrainedAsync.currentStatus);

        // Wait for a few seconds
        setTimeout(() => {
            // Log the current status of the queue
            console.log(
                'Status after a few seconds:',
                constrainedAsync.currentStatus
            );

            // Add more tasks to the queue
            constrainedAsync.addToQueue({
                args: [7, 1000],
                function: simulateTask,
            });
            constrainedAsync.addToQueue({
                args: [8, 500],
                function: simulateTask,
            });
        }, 3000);

        // Wait for a few more seconds
        setTimeout(() => {
            // Log the current status of the queue
            console.log(
                'Status after a few more seconds:',
                constrainedAsync.currentStatus
            );

            // Clear the queue
            constrainedAsync.clearQueue();
            console.log('Queue cleared');

            // Log the current status after clearing the queue
            console.log(
                'Status after clearing the queue:',
                constrainedAsync.currentStatus
            );
        }, 6000);

        // Stop the constrained async execution after a certain time
        setTimeout(() => {
            constrainedAsync.stop();
            console.log('Constrained async execution stopped');
        }, 10000);
    }, 50000);

    // test event emitter
    it('event emitter', async () => {
        const ee = new EventEmitter<Record<string, Array<unknown>>>({
            captureRejections: false,
        });
        ee.addListener('test', (a, b) => {
            console.log('[LOOOOOOG]', a, b);
        });
        ee.emit('test', 1, 2);

        await new Promise((res) => {
            setTimeout(() => {
                res(null);
            }, 2000);
        });
        ee.emit('test', 3, 5);
    }, 50000);

    it('battle test 2', async () => {
        // Async function to simulate a task
        const simulateTask = async (
            taskId: number,
            delay: number
        ): Promise<string> => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return `Task ${taskId} completed`;
        };

        // Create an instance of ConstrainedAsync with desired options
        const constrainedAsync = new AsyncThrottle({
            maxThreshold: 3,
            delayExecutions: 1000,
        });

        constrainedAsync.on('result', async (result) => {
            console.log(`Task completed [${result.id}] : ${result.value}`);
        });
        constrainedAsync.on('resultError', async (result) => {
            console.error(
                `Task failed [${result.id}] : ${result.error?.message}`
            );
        });
        constrainedAsync.on('log', (message) => {
            console.log(`[LOG] ${message}`);
        });
        constrainedAsync.on('stop', () => {
            // close all the things that has to be closed
        });

        // Create an array of tasks to be added to the queue
        const tasks: TAsyncThrottleFunction<[number, number], string>[] = [
            { args: [1, 2000], function: simulateTask },
            { args: [2, 1500], function: simulateTask },
            { args: [3, 1000], function: simulateTask },
            { args: [4, 500], function: simulateTask },
            { args: [5, 1000], function: simulateTask },
            { args: [6, 1500], function: simulateTask },
        ];

        // Add tasks to the queue
        tasks.forEach((task) => {
            constrainedAsync.addToQueue(task);
        });

        // Log the current status of the queue
        console.log('Initial status:', constrainedAsync.currentStatus);

        // Wait for a few seconds
        setTimeout(() => {
            // Log the current status of the queue
            console.log(
                'Status after a few seconds:',
                constrainedAsync.currentStatus
            );

            // Add more tasks to the queue
            constrainedAsync.addToQueue({
                args: [7, 1000],
                function: simulateTask,
            });
            constrainedAsync.addToQueue({
                args: [8, 500],
                function: simulateTask,
            });
        }, 3000);

        // Wait for a few more seconds
        setTimeout(() => {
            // Log the current status of the queue
            console.log(
                'Status after a few more seconds:',
                constrainedAsync.currentStatus
            );

            // Clear the queue
            constrainedAsync.clearQueue();
            console.log('Queue cleared');

            // Log the current status after clearing the queue
            console.log(
                'Status after clearing the queue:',
                constrainedAsync.currentStatus
            );
        }, 6000);

        // Stop the constrained async execution after a certain time
        setTimeout(() => {
            constrainedAsync.stop();
            console.log('Constrained async execution stopped');
        }, 10000);
    }, 50000);
});
