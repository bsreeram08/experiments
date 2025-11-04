# async-throttle

A TypeScript library for managing and executing asynchronous functions with constraints and logging capabilities. async-throttle helps you control the concurrent execution of asynchronous tasks, making it easier to manage resource usage and prevent overwhelming external services.

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
-   Priority queue support for task ordering
-   Pause and resume execution
-   Event-based monitoring of task execution and queue status
-   Memory leak prevention with listener cleanup methods
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

### Priority Queue

You can add tasks with different priorities. Higher priority tasks are executed first:

```typescript
// Add a high priority task (priority: 10)
asyncThrottle.addToQueue(highPriorityTask, 'high-priority-id', 10);

// Add a normal priority task (priority: 0, default)
asyncThrottle.addToQueue(normalTask);

// Add a low priority task (priority: -5)
asyncThrottle.addToQueue(lowPriorityTask, 'low-priority-id', -5);
```

### Pause and Resume

You can pause and resume execution at any time:

```typescript
// Pause execution
asyncThrottle.pause();

// Check if paused
if (asyncThrottle.isPaused) {
    console.log('Execution is paused');
}

// Resume execution
asyncThrottle.resume();
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
asyncThrottle.on('pause', () => {
    console.log(`Execution paused`);
});
asyncThrottle.on('resume', () => {
    console.log(`Execution resumed`);
});
asyncThrottle.on('clear', () => {
    console.log(`Queue cleared`);
});
asyncThrottle.on('log', (message) => console.log(`LOG: ${message}`));
```

### Event Listener Cleanup

To prevent memory leaks, you can remove event listeners when they're no longer needed:

```typescript
const resultHandler = (res) => console.log(`RESULT: ${JSON.stringify(res)}`);

// Add listener
asyncThrottle.on('result', resultHandler);

// Remove specific listener
asyncThrottle.off('result', resultHandler);

// Remove all listeners for a specific event
asyncThrottle.removeAllListeners('result');

// Remove all listeners for all events
asyncThrottle.removeAllListeners();
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

#### Constructor

-   `constructor(options: AsyncThrottleOptions)`

#### Methods

-   `addToQueue(task: TAsyncThrottleFunction<TArgs, TResponse>, id?: string, priority?: number): void` - Add a task to the queue with optional priority (higher values = higher priority)
-   `clearQueue(): void` - Clear all pending tasks from the queue
-   `stop(): void` - Stop the execution loop permanently
-   `pause(): void` - Pause the execution loop (can be resumed)
-   `resume(): void` - Resume a paused execution loop
-   `on(eventName: string, callback: Function): void` - Add an event listener
-   `off(eventName: string, callback: Function): void` - Remove a specific event listener
-   `removeAllListeners(eventName?: string): void` - Remove all listeners for an event or all events

#### Properties

-   `currentStatus: AsyncThrottleStatus` - Get current queue and execution status
-   `isPaused: boolean` - Check if execution is currently paused

#### Events

-   `result` - Emitted when a task completes successfully
-   `resultError` - Emitted when a task fails with an error
-   `empty` - Emitted when the queue is empty
-   `add` - Emitted when a task is added to the queue
-   `stop` - Emitted when execution is stopped
-   `pause` - Emitted when execution is paused
-   `resume` - Emitted when execution is resumed
-   `clear` - Emitted when the queue is cleared
-   `log` - Emitted for debug/info messages

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
5. Always clean up event listeners using `off()` or `removeAllListeners()` to prevent memory leaks.
6. Use priority values strategically - reserve high priorities for truly critical tasks.
7. Use `pause()` and `resume()` to control execution flow based on application state or resource availability.
8. Consider using a factory function to create AsyncThrottle instances with consistent configuration across your application.

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

### Priority Queue Example

```typescript
import { AsyncThrottle } from '@mareers/async-throttle';

const throttle = new AsyncThrottle({
    maxThreshold: 2,
    delayExecutions: 500,
});

// Critical task - highest priority
throttle.addToQueue(
    {
        args: ['critical'],
        function: async (type) => {
            console.log(`${type} task started`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return `${type} completed`;
        },
    },
    'critical-1',
    100 // High priority
);

// Normal tasks - default priority
for (let i = 0; i < 5; i++) {
    throttle.addToQueue({
        args: ['normal'],
        function: async (type) => {
            console.log(`${type} task ${i} started`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return `${type} ${i} completed`;
        },
    });
}

// Low priority background task
throttle.addToQueue(
    {
        args: ['background'],
        function: async (type) => {
            console.log(`${type} task started`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return `${type} completed`;
        },
    },
    'bg-1',
    -10 // Low priority
);

throttle.on('result', (res) => {
    console.log('Completed:', res.value);
});
```

### Pause and Resume Example

```typescript
import { AsyncThrottle } from '@mareers/async-throttle';

const throttle = new AsyncThrottle({
    maxThreshold: 3,
    delayExecutions: 1000,
});

// Add some tasks
for (let i = 0; i < 10; i++) {
    throttle.addToQueue({
        args: [i],
        function: async (id) => {
            console.log(`Processing task ${id}`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return `Task ${id} done`;
        },
    });
}

// Pause after 5 seconds
setTimeout(() => {
    console.log('Pausing execution...');
    throttle.pause();
}, 5000);

// Resume after 10 seconds
setTimeout(() => {
    console.log('Resuming execution...');
    throttle.resume();
}, 10000);

// Clean up listeners when done
throttle.on('empty', () => {
    console.log('All tasks completed');
    throttle.removeAllListeners();
    throttle.stop();
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
