import { AsyncThrottle, TAsyncThrottleFunction } from './async-throttle';

describe('constrainedAsync', () => {
    it('should work', async () => {
        const cs = new AsyncThrottle<unknown>({
            completionCallback: async function (data) {
                console.log(data);
            },
            failedCallback: (error) => {
                console.log(error);
            },
            maxThreshold: 5,
            delayExecutions: 1000,
            loggingFunction: console.log,
        });

        for (let i = 0; i < 1000; i++) {
            console.log(`ADDED ${i + 1}`);
            cs.addToQueue({
                args: ['100', 10],
                function: async (num, str) => {
                    return {
                        hello: `${num} ${str}`,
                    };
                },
            });
        }

        await new Promise((res) => {
            setTimeout(() => {
                console.log('Called destroy');
                cs.stop();
                res(null);
                process.exit(0);
            }, 500000);
        });
    }, 500000);

    it('battle test', async () => {
        // Custom logging function
        const loggingFunction = (message: string) => {
            console.log(`[LOG] ${message}`);
        };

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
            completionCallback: async (result: unknown) => {
                console.log(`Task completed: ${result}`);
            },
            failedCallback: (error: Error) => {
                console.error(`Task failed: ${error.message}`);
            },
            maxThreshold: 3,
            delayExecutions: 1000,
            loggingFunction,
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
