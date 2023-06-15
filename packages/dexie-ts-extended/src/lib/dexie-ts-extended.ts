import { DatabaseChange, TDexieConfig, TShape } from './types';

import Dexie, { IndexableType, Table } from 'dexie';
import 'dexie-observable';
import { Observable, fromEventPattern } from 'rxjs';
import { map } from 'rxjs/operators';

export function database<
    TableName extends string = string,
    Shape extends TShape<TableName> = TShape<TableName>
>(config: TDexieConfig<TableName>) {
    const db = new Dexie(config.databaseName);
    async function start(): Promise<void> {
        db.version(config.databaseVersion).stores(
            config.tables
                .map((v) => {
                    const obj: { [key: string]: string } = {};
                    obj[v.tableName] = [
                        v.primaryKeyIndex ?? '++id',
                        ...(v.indexes ?? []),
                    ].join(',');
                    return obj;
                })
                .reduce((pv, cv) => {
                    return {
                        ...pv,
                        ...cv,
                    };
                }, {})
        );

        await db.open().catch((e) => {
            console.error(
                `Unable to open database : ${config.databaseName} with error ${e.message}`
            );
            console.error(e);
        });
    }

    function getDatabase(): Dexie {
        return db;
    }

    function getTable<T extends TableName>(
        tableName: T
    ): Table<Shape[T], keyof Shape[T]> {
        if (!db.isOpen())
            throw new Error(`Database ${config.databaseName} is not open.`);
        return db.table<Shape[T], keyof Shape[T]>(tableName);
    }

    function closeDatabase() {
        if (db.isOpen()) db.close();
        else throw new Error(`Database is already closed.`);
    }

    function dexie(): Dexie {
        return db;
    }

    function onChanges<T extends TableName>(
        tableName: T
    ): Observable<DatabaseChange<keyof Shape[T], TableName, Shape>> {
        return fromEventPattern((handler) => db.on('changes', handler)).pipe(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map((data: any) => data[0]),
            map((changes: DatabaseChange<T, TableName, Shape>[]) =>
                changes.filter((x) => !tableName || x.table === tableName)
            ),
            map((changes: DatabaseChange<T, TableName, Shape>[]) => changes[0])
        );
    }

    return {
        start,
        getDatabase,
        getTable,
        closeDatabase,
        dexie,
        onChanges,
    };
}

export type ExtendedDexie<
    TableName extends string = string,
    Shape extends {
        [key in TableName]: {
            [key: string]: IndexableType;
        };
    } = {
        [Key in TableName]: { [key: string]: IndexableType };
    }
> = ReturnType<typeof database<TableName, Shape>>;
