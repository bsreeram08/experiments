# @mareers/dexie-ts-extended

This is a simple wrapper for Dexie.js library that provides a type-safe interface for managing IndexedDB databases.

## Installation

```sh
npm install --save @mareers/dexie-ts-extended
```

Usage

```typescript
import { database } from '@mareers/dexie-ts-extended';

type Tables = {
    books: {
        id: string;
        title: string;
        author: string;
    };
};

const db = database<keyof Tables, Tables>({
    databaseName: 'my-db',
    databaseVersion: 1,
    tables: [
        {
            tableName: 'books',
            primaryKeyIndex: 'id',
            indexes: ['title', 'author'],
        },
    ],
});

await db.start();

const books = db.getTable('books');

await books.add({
    id: 1,
    title: 'Dune',
    author: 'Frank Herbert',
});

const allBooks = await books.toArray();

console.log(allBooks);

const booksObservable = db.onChanges('books');
booksObservable.subscribe(async (changeObject) => {
    if (changeObject.type === DatabaseChangeType.Update) {
        console.log(changeObject.obj.books); // Latest changed object
        // Do change type operations.
        await sendDataToApi(changeObject.obj.books.id, changeObject.obj.books); // example function
    }
});

async function sendDataToApi(bookId: string, book: Tables['books']): Promise<void> {
    // Send data to database
}

db.closeDatabase();
```

## API

### `database(config)`

Creates a new instance of the database.

### Parameters

-   config: An object that contains the following properties:

    -   databaseName (required): The name of the database.
    -   databaseVersion (required): The version number of the database.
    -   tables (required): An array of objects that describe the tables in the database.

        Each object must contain the following properties:

        -   tableName (required): The name of the table.
        -   primaryKeyIndex (optional): The name of the primary key index. Defaults to
            `++id`.
        -   indexes (optional): An array of names for indexes to be created on the table.

### Returns

An object that contains the following methods:

-   start():

    Opens the database.

-   getTable(name):

    Returns a table object for the specified table name.

-   close():

    Closes the database.

-   getTable(name)

    Returns a table object for the specified table name.

-   onChanges(name)

    Returns an observable object for changes such as Create, Update and Delete.

## TODO

-   Fix test scripts to emulate dexie with Jest.
-   Infer Table name and schema from the provided Config object.

### Links

[Git Repository](https://github.com/bsreeram08/experiments/tree/main/packages/dexie-ts-extended)
