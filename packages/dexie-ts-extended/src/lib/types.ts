import { IndexableType } from 'dexie';
import { DatabaseChangeType } from 'dexie-observable/api';

export { DatabaseChangeType } from 'dexie-observable/api';

export type TShape<TableName extends string> = {
    [key in TableName]: {
        [key: string]: IndexableType;
    };
};

export interface ICreateChange<
    Keys extends Key,
    TableName extends string,
    Type
> {
    type: DatabaseChangeType.Create;
    table: TableName;
    key: Keys;
    obj: Type;
    source?: string;
}

export type IUpdateChange<Keys extends Key, TableName extends string, Type> = {
    type: DatabaseChangeType.Update;
    table: TableName;
    key: Keys;
    obj: Type;
    oldObj: Type;
    source?: string;
    mods: Partial<Type>;
};

export interface IDeleteChange<
    Keys extends Key,
    TableName extends string,
    Type
> {
    type: DatabaseChangeType.Delete;
    table: TableName;
    key: Keys;
    oldObj: Type;
    source?: string;
}

export type DatabaseChange<
    Keys extends Key,
    TableName extends string,
    Type = unknown
> =
    | ICreateChange<Keys, TableName, Type>
    | IUpdateChange<Keys, TableName, Type>
    | IDeleteChange<Keys, TableName, Type>;

type Key = string | number | symbol;

export type TDexieConfig<TableName extends string> = {
    databaseName: string;
    databaseVersion: number;
    tables: {
        tableName: TableName;
        primaryKeyIndex?: string;
        indexes?: IndexableType[];
    }[];
};
