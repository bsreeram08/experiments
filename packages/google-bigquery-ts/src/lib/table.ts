import {
    BigQuery,
    InsertRowsOptions,
    Query,
    Table,
    TableField,
    TableMetadata,
} from '@google-cloud/bigquery';
import bigquery from '@google-cloud/bigquery/build/src/types';
import { Schema } from './types';

export type TRow = Record<string, unknown>;

export function createRecordInTable<
    TRow extends Record<string, unknown> = Record<string, unknown>
>(
    bigqueryClient: BigQuery,
    config: {
        datasetName: string;
        tableName: string;
        record: TRow;
        options?: InsertRowsOptions;
    }
): Promise<{
    response: bigquery.ITableDataInsertAllResponse | bigquery.ITable;
}> {
    return bigqueryClient
        .dataset(config.datasetName)
        .table(config.tableName)
        .insert(config.record, config.options)
        .then((v) => ({
            response: v[0],
        }));
}

export function createManyRecordInTable<TRow extends Record<string, unknown>>(
    bigqueryClient: BigQuery,
    config: {
        datasetName: string;
        tableName: string;
        records: Array<{ data: TRow; insertId?: string }>;
    }
) {
    return bigqueryClient
        .dataset(config.datasetName)
        .table(config.tableName)
        .insert(
            config.records.map((v) => v.data),
            {
                rows: config.records,
            }
        );
}

export function createTable(
    bigqueryClient: BigQuery,
    config: {
        datasetName: string;
        tableName: string;
    },
    schema: Schema
): Promise<{ response: Table; resultDetails: bigquery.ITable }> {
    const options: TableMetadata = {
        schema: [] as Array<TableField>,
    };
    options.schema = Object.entries(schema).map((v) => ({
        name: v[0],
        type: v[1].type,
        fields: v[1].fields,
        mode: v[1].mode,
    }));
    return bigqueryClient
        .dataset(config.datasetName)
        .createTable(config.tableName, options)
        .then((v) => ({
            response: v[0],
            resultDetails: v[1],
        }));
}

export function checkIfTableExists(
    bigqueryClient: BigQuery,
    config: {
        datasetName: string;
        tableName: string;
    }
): Promise<boolean> {
    return bigqueryClient
        .dataset(config.datasetName)
        .table(config.tableName)
        .exists()
        .then((v) => v[0]);
}

export function queryFromTable<T extends TRow>(
    bigqueryClient: BigQuery,
    config: {
        datasetName: string;
        tableName: string;
    },
    query: Query
): Promise<{ response: Array<T>; metadata: bigquery.IJob }> {
    return bigqueryClient
        .dataset(config.datasetName)
        .table(config.tableName)
        .query(query)
        .then((v) => ({
            response: v[0],
            metadata: v[1],
        }));
}
