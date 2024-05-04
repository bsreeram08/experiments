# async-throttle

A TypeScript library for managing and executing asynchronous functions with constraints and logging capabilities.

## Installation

You can install the package using npm:

```bash
npm install @mareers/async-throttle
```

## Usage

Import the `AsyncThrottle` class and the `TAsyncThrottleFunction` type from the package:

```typescript
import { AsyncThrottle, TAsyncThrottleFunction } from '@mareers/async-throttle';
```

Create an instance of `AsyncThrottle` with the desired options:

```typescript
const asyncThrottle = new AsyncThrottle({
    completionCallback: async (result: unknown) => {
        console.log(`Task completed: ${result}`);
    },
    failedCallback: (error: Error) => {
        console.error(`Task failed: ${error.message}`);
    },
    maxThreshold: 3,
    delayExecutions: 1000,
    loggingFunction: (message: string) => {
        console.log(`[LOG] ${message}`);
    },
});
```

Add functions to the queue using the `addToQueue` method:

```typescript
const task: TAsyncThrottleFunction<[number, number], string> = {
    args: [1, 2000],
    function: async (taskId: number, delay: number) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return `Task ${taskId} completed`;
    },
};

asyncThrottle.addToQueue(task);
```

You can check the current status of the queue using the currentStatus getter:

```typescript
console.log(asyncThrottle.currentStatus);
```

To clear the queue, use the clearQueue method:

```typescript
asyncThrottle.clearQueue();
```

To stop the async throttle execution, call the stop method:

```typescript
asyncThrottle.stop();
```

### Options

The AsyncThrottle constructor accepts an options object with the following properties:

`completionCallback` (required): A callback function to be invoked when a task is completed successfully. It receives the result of the task as a parameter.
`failedCallback` (required): A callback function to be invoked when a task fails. It receives the error object as a parameter.
`maxThreshold` (required): The maximum number of tasks that can be executed concurrently.
`delayExecutions` (required): The delay (in milliseconds) between each execution loop.
`loggingFunction` (optional): A custom logging function to log messages. If not provided, the default console.log will be used.

### Types

`TAsyncThrottleFunction<TArgs extends Array<any>, TResponse>`: Represents an asynchronous function with arguments of type TArgs and a return type of `Promise<TResponse>`.

### Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the GitHub repository.

### License

This package is released under the MIT License.
