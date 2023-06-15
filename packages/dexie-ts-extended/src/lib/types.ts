import { IndexableType } from 'dexie';
import { DatabaseChangeType } from 'dexie-observable/api';

export { DatabaseChangeType } from 'dexie-observable/api';

export type TShape<TableName extends string> = {
    [key in TableName]: {
        [key: string]: IndexableType;
    };
};

export interface ICreateChange<Keys, Type> {
    type: DatabaseChangeType.Create;
    table: string;
    key: Keys;
    obj: Type;
    source?: string;
}

export type IUpdateChange<Keys, Type> = {
    type: DatabaseChangeType.Update;
    table: string;
    key: Keys;
    obj: Type;
    oldObj: Type;
    source?: string;
    mods: Partial<Type>;
};

export interface IDeleteChange<Keys extends Key, Type> {
    type: DatabaseChangeType.Delete;
    table: string;
    key: Keys;
    oldObj: Type;
    source?: string;
}

export type DatabaseChange<Keys extends Key, Type> =
    | ICreateChange<Keys, Type>
    | IUpdateChange<Keys, Type>
    | IDeleteChange<Keys, Type>;

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
