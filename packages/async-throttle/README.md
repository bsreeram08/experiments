# async-throttle

A TypeScript library for managing and executing asynchronous functions with constraints and logging capabilities. async-throttle helps you control the concurrent execution of asynchronous tasks, making it easier to manage resource usage and prevent overwhelming external services.

![npm version](https://img.shields.io/npm/v/@bsreeram08/async-throttle)

## Table of Contents

-   [Features](#features)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Configuration](#configuration)
-   [API Reference](#api-reference)
-   [Error Handling](#error-handling)
-   [Best Practices](#best-practices)
-   [Examples](#examples)
-   [TypeScript Support](#typescript-support)
-   [Browser Compatibility](#browser-compatibility)
-   [Contributing](#contributing)
-   [Changelog](#changelog)
-   [License](#license)

## Features

-   Control concurrent execution of asynchronous tasks
-   Set delays between execution cycles
-   Event-based monitoring of task execution and queue status
-   TypeScript support with type definitions
-   Flexible configuration options

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

You can check the current status of the queue using the `currentStatus` getter:

```typescript
console.log(asyncThrottle.currentStatus);
```

To clear the queue, use the `clearQueue` method:

```typescript
asyncThrottle.clearQueue();
```

To stop the async throttle execution, call the `stop` method:

```typescript
asyncThrottle.stop();
```

Async Throttle provides a bunch of events to listen to:

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

## Configuration

The `AsyncThrottle` constructor accepts an options object with the following properties:

-   `maxThreshold` (required): The maximum number of tasks that can be executed concurrently.
-   `delayExecutions` (required): The delay (in milliseconds) between each execution loop.

Additional configuration options:

-   `logLevel` (optional): Set the logging level ('debug', 'info', 'warn', 'error'). Default: 'info'.
-   `retryAttempts` (optional): Number of retry attempts for failed tasks. Default: 0.
-   `retryDelay` (optional): Delay (in milliseconds) between retry attempts. Default: 1000.

## API Reference

### AsyncThrottle

-   `constructor(options: AsyncThrottleOptions)`
-   `addToQueue(task: TAsyncThrottleFunction<TArgs, TResponse>): void`
-   `clearQueue(): void`
-   `stop(): void`
-   `on(eventName: string, callback: Function): void`
-   `currentStatus: AsyncThrottleStatus`

### Types

-   `TAsyncThrottleFunction<TArgs extends Array<any>, TResponse>`
-   `AsyncThrottleOptions`
-   `AsyncThrottleStatus`

## Error Handling

async-throttle provides error handling through the `resultError` event. You can listen to this event to catch and handle any errors that occur during task execution:

```typescript
asyncThrottle.on('resultError', (error) => {
    console.error('Task execution failed:', error);
    // Implement your error handling logic here
});
```

Additionally, you can use try-catch blocks when adding tasks to the queue to handle any synchronous errors that might occur:

```typescript
try {
    asyncThrottle.addToQueue(task);
} catch (error) {
    console.error('Failed to add task to queue:', error);
}
```

## Best Practices

1. Choose appropriate `maxThreshold` and `delayExecutions` values based on your specific use case and the resources you're working with.
2. Use TypeScript to leverage type checking and improve code quality.
3. Implement proper error handling by listening to the `resultError` event.
4. Clear the queue and stop the AsyncThrottle instance when it's no longer needed to free up resources.
5. Consider using a factory function to create AsyncThrottle instances with consistent configuration across your application.

## Examples

### Real-world use case: Rate-limited API calls

```typescript
import { AsyncThrottle, TAsyncThrottleFunction } from '@mareers/async-throttle';
import axios from 'axios';

const apiThrottle = new AsyncThrottle({
    maxThreshold: 5, // Maximum 5 concurrent API calls
    delayExecutions: 1000, // 1 second delay between execution cycles
});

const fetchUserData = async (userId: number): Promise<any> => {
    const response = await axios.get(`https://api.example.com/users/${userId}`);
    return response.data;
};

// Add multiple API calls to the queue
for (let i = 1; i <= 20; i++) {
    const task: TAsyncThrottleFunction<[number], any> = {
        args: [i],
        function: fetchUserData,
    };
    apiThrottle.addToQueue(task);
}

apiThrottle.on('result', (result) => {
    console.log('User data fetched:', result);
});

apiThrottle.on('resultError', (error) => {
    console.error('Failed to fetch user data:', error);
});

apiThrottle.on('empty', () => {
    console.log('All API calls completed');
    apiThrottle.stop();
});
```

## TypeScript Support

async-throttle is written in TypeScript and provides type definitions out of the box. This ensures type safety when using the library in your TypeScript projects.

## Browser Compatibility

async-throttle is primarily designed for use in Node.js environments. While it may work in modern browsers that support ES6+ features, it has not been extensively tested for browser compatibility. If you need to use async-throttle in a browser environment, consider using a bundler like webpack or rollup to ensure compatibility.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the GitHub repository.

## Changelog

See [CHANGELOG.md](https://github.com/mareers/async-throttle/blob/main/CHANGELOG.md) for details on version history and updates.

## License

This package is released under the MIT License.

---

**Note**: When working with database connections or other resources that may not be available when the function gets executed, use the following pattern:

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

This ensures that the connection is accessed at the time of execution, rather than being passed as an argument that might become stale.
