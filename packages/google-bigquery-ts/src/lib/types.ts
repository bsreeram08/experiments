import bigquery from '@google-cloud/bigquery/build/src/types';

type DataTypeMap = {
    STRING: string;
    BYTES: Buffer;
    INTEGER: number;
    FLOAT: number;
    BOOLEAN: boolean;
    TIMESTAMP: Date;
    DATE: Date;
    TIME: Date;
    DATETIME: Date;
    GEOGRAPHY: string;
    BIGNUMERIC: bigint;
    JSON: string;
    RECORD: Record<string, unknown>;
};

type DataType = keyof DataTypeMap;

type GetDataType<T extends DataType> = DataTypeMap[T];

type GetNonNullableTypeFromSchema<T extends Schema> = {
    [P in keyof T]: T[P] extends {
        mode: 'REPEATED';
        type: infer U extends keyof DataTypeMap;
    }
        ? Array<GetDataType<U>>
        : T[P] extends { mode: 'NULLABLE' }
        ? never
        : GetDataType<T[P]['type']>;
};

type GetNullableTypeFromSchema<T extends Schema> = {
    [P in keyof T]: T[P] extends { mode: 'NULLABLE' }
        ? GetDataType<T[P]['type']>
        : never;
};

type FilterNever<T extends Record<string, unknown>> = Omit<
    T,
    { [P in keyof T]: T[P] extends Record<P, never> ? P : never }[keyof T]
>;

type DataMode = 'REPEATED' | 'NULLABLE' | 'REQUIRED';

export type GetTypeFromSchema<T extends Schema> = Prettify<
    FilterNever<GetNonNullableTypeFromSchema<T>> &
        Partial<FilterNever<GetNullableTypeFromSchema<T>>>
>;

export type Schema = Prettify<
    Record<
        string,
        {
            type: DataType;
            mode: DataMode;
            category?: string;
            fields?: Array<bigquery.ITableFieldSchema & { type: DataType }>;
            default?: string | Record<string, unknown> | number;
        }
    >
>;

export type TRow = Record<string, unknown>;

/**
 * Utility Types
 */

type LoggingFunction = (...args: Array<unknown>) => void;
export type Logger = {
    log: LoggingFunction;
    error: LoggingFunction;
    warn: LoggingFunction;
    [K: string | symbol]: LoggingFunction;
};

type Prettify<T> = {
    [K in keyof T]: T[K];
    // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
