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
    maxThreshold: 3,
    delayExecutions: 1000,
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

Async Throttle provides a bunch of events to listen to.

-   `result` The result of an execution
-   `resultError` The error-result of an Execution
-   `empty` Queue is empty
-   `add` Enqueued something
-   `stop` Stopped the AsyncThrottler
-   `clear` Clear the queue
-   `log` Internal Log

```typescript
asyncThrottle.on('result', (res) => console.log(`RESULT: ${JSON.stringify(res)}`));
asyncThrottle.on('resultError', (res) => console.log(`RESULT_ERROR: ${JSON.stringify(res)}`));
asyncThrottle.on('empty', () => {
    asyncThrottle.stop();
});
asyncThrottle.on('add', () => {
    // do when something is added
});
asyncThrottle.on('stop', () => {
    console.log(`Execution stopped`);
});
asyncThrottle.on('clear', () => {
    console.log(`Queue cleared`);
});
asyncThrottle.on('log', (message) => console.log(`LOG: ${message}`));
```

### Options

The AsyncThrottle constructor accepts an options object with the following properties:

`maxThreshold` (required): The maximum number of tasks that can be executed concurrently.
`delayExecutions` (required): The delay (in milliseconds) between each execution loop.

### Types

`TAsyncThrottleFunction<TArgs extends Array<any>, TResponse>`: Represents an asynchronous function with arguments of type TArgs and a return type of `Promise<TResponse>`.

### Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the GitHub repository.

### License

This package is released under the MIT License.

### Note

If you're passing database connection in the args, the connection will not be available when the function gets executed. You'd have to do something like this.

```typescript
import { createConnection } from 'your-database-library';
let connection = await createConnection({
    // Connection configuration
});

function someDbOperation(connection) {
    // some operation that uses db connection
}

// Do
const task: TAsyncThrottleFunction<[], string> = {
    args: [],
    function: async () => {
        someDbOperation(connection);
    },
};

// Don't
const task2: TAsyncThrottleFunction<[], string> = {
    args: [connection], // Connection might not be available
    function: someDbOperation,
};
```
