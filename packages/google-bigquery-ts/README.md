# @mareers/google-bigquery-ts

A TypeScript client library for interacting with Google BigQuery using the @google-cloud/bigquery package.

This library provides a wrapper around the Google Cloud BigQuery Node.js client library to make it easier to work with BigQuery datasets and tables. It provides a simple and intuitive interface for creating and querying datasets and tables in BigQuery.

## Requirements

-   Node.js version 12 or later
-   Typescript
-   Google BigQuery Library
-   Someone cool like the person reading this (just you is fine)

## Installation

To use the BigQuery client library in your project, simply install it using npm:
FYI : To use this library, you need to install @google-cloud/bigquery:

```sh
npm install --save @mareers/google-bigquery-ts @google-cloud/bigquery
```

## Usage

### Create Schema

A schema defines the structure of a BigQuery table. It consists of a record of field names and their associated types.

```typescript
import { Schema, GetTypeFromSchema } from '@mareers/google-bigquery-ts';

const schema: Schema = {
    name: {
        type: 'STRING',
        mode: 'NULLABLE',
    },
    age: {
        type: 'INTEGER',
        mode: 'REQUIRED',
    },
    isEmployed: {
        type: 'BOOLEAN',
        mode: 'NULLABLE',
    },
    address: {
        type: 'RECORD',
        mode: 'NULLABLE',
        fields: [
            {
                name: 'street',
                type: 'STRING',
                mode: 'NULLABLE',
            },
            {
                name: 'city',
                type: 'STRING',
                mode: 'NULLABLE',
            },
            {
                name: 'country',
                type: 'STRING',
                mode: 'NULLABLE',
            },
        ],
    },
};

type Person = GetTypeFromSchema<typeof schema>;
```

### Create BigQuery Client

createBigQueryClient function returns an object with methods to operate on a dataset in BigQuery.

```typescript
const { createBigQueryClient } = require('@path/to/library');

const bigqueryClient = createBigQueryClient(options?, logger?);
```

Parameters

-   options (optional): An object containing the following properties:

-   projectId (optional): The ID of the project containing the BigQuery dataset. If not specified, the default project ID is- used.

-   keyFilename (optional): The full path to the JSON file containing your service account key. If not specified, the default- credentials are used.

-   autoRetry (optional): If set to true, the client library will automatically retry requests that fail due to network errors- or 5xx status codes. Default is false.

-   location (optional): The geographic location of the BigQuery dataset. If not specified, the default location is used.

-   credentials (optional): An object containing the following properties:

-   client_email: The email address of the service account.

-   private_key: The private key of the service account.

-   logger (optional): An object with methods for logging. This can be useful for debugging.

Returns

-   An object with the following methods:

### Create Dataset

Dataset method returns an object with methods to operate on a specific dataset in BigQuery.
Create method creates a new dataset in BigQuery.

```typescript
const myDataset = bigqueryClient.dataset('my-dataset');
myDataset.create(); // A Promise that resolves to the newly created dataset.
```

### Exists

exists method checks if the dataset exists in BigQuery.

```typescript
myDataset.exists();
```

Returns

-   A Promise that resolves to true if the dataset exists, and false if it doesn't.

### Query (WIP)

Query method executes a query against the dataset in BigQuery.

```typescript
myDataset.query<T extends TRow>(query: string);
```

Parameters

-   query: The query string to execute.

Returns

-   A Promise that resolves to an array of rows returned by the query.

### Table

table method returns an object with methods to operate on a specific table in the dataset.

```typescript
import { Schema } from '@mareers/google-bigquery-ts';
const schema: Schema = {
    name: {
        type: 'STRING',
        mode: 'NULLABLE',
    },
    // Replace table schema
};
const myTable = myDataset.table('my-table');
myTable.create(schema); // A Promise that resolves to the newly created table.
```

### Table exists

The Exists method checks if the table exists in the dataset.

```typescript
myTable.exists();
```

Returns

-   A Promise that resolves to true if the table exists, and false if it doesn't.

## CRUD

This is a TypeScript module that exports a CRUD function that can be used to create, read, update, and delete data from a BigQuery table. However, please note that the CRUD method is still under development and is not ready for use in production code until it has been fully tested and released.

### Usage

To use the crud function, you need to provide it with an options object that contains the following properties:

-   bqClient: an instance of BigQueryClient from the @google-cloud/bigquery package.
-   datasetName: the name of the dataset where the table will be created or updated.
-   tableName: the name of the table that will be created or updated.
-   tableSchema: the schema of the table that will be created or updated.
-   logger (optional): a logger object that implements a log method. If not provided, logging will be disabled.

Here is an example of how to use the crud function:

```typescript
import { BigQuery } from '@google-cloud/bigquery';
import { crud } from '@jetit/bigquery-crud';

const bqClient = new BigQuery();
const datasetName = 'my_dataset';
const tableName = 'my_table';
const tableSchema = {
    id: {
        type: 'STRING',
        mode: 'REQUIRED',
    },
    name: {
        type: 'STRING',
        mode: 'REQUIRED',
    },
    age: {
        type: 'NUMBER',
        mode: 'REQUIRED',
    },
    isCool: {
        type: 'BOOLEAN',
        mode: 'NULLABLE',
    },
    // Replace table schema
};
const logger = console;

const myCrud = crud({ bqClient, datasetName, tableName, tableSchema, logger });

await myCrud.createTable();
await myCrud.insertOne({ id: '1', name: 'John', age: 25 });
await myCrud.insertMany([
    { data: { id: '2', name: 'Mary', age: 30 }, insertId: '2' },
    { data: { id: '3', name: 'Tom', age: 40 }, insertId: '3' },
]);
const tableExists = await myCrud.exists();
```

### Returns

A CRUD object with the following methods:

-   exists(requestId?: string): Promise<boolean>: checks if the table exists.
-   insertOne<T extends TRow>(data: T, requestId?: string): Promise<[T, unknown]>: inserts a single row of data into the table.
-   insertMany<T extends TRow>(data: Array<T>, requestId?: string): Promise<[T, unknown]>: inserts a single row of data into the table.
-   createTable(requestId?:string): Promise<{ response: Table; resultDetails: bigquery.ITable; }> Creates the table if it does not exists

# FAQs

### Why use this schema?

    The schema is essential because it defines the structure of the data that can be stored in a BigQuery table, including the name, data type, mode, and any nested subfields. By using the schema in your types file, you are providing a way for users of your BigQuery client library to define the structure of their data in a type-safe manner. This ensures that the data they are working with matches the structure defined in the schema, preventing errors that may arise from working with unstructured or incorrectly formatted data.

    Using the schema in your types file also allows for better code readability and maintainability, as the schema serves as a clear and concise reference for the expected data structure. This helps other developers understand the expected shape of the data and can make it easier to debug issues that may arise.
