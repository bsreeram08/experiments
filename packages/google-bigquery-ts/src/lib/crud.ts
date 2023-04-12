import { Logger, Schema, TRow } from './types';
import { BigQueryClient } from './bigquery';
import { generateID } from '@jetit/id';

/**
 *
 * ? CRUD: Work In Progress ?
 *
 * This CRUD method is still under development and is not ready for use.
 * Please do not use it in production code until it has been fully tested and
 * released.
 *
 * @param options {bqClient,datasetName,tableName,tableSchema,logger}
 * @returns CRUD
 */
export function crud(options: {
    bqClient: BigQueryClient;
    datasetName: string;
    tableName: string;
    tableSchema: Schema;
    logger?: Logger;
}) {
    const { bqClient, datasetName, tableName, tableSchema, logger } = options;
    async function createTable(requestId = generateID()) {
        logger?.log(
            `[${requestId}] Create Logs Table called for Dataset ${datasetName} and table : ${tableName}`
        );
        const client = bqClient.dataset(datasetName);
        if (!(await client.exists())) {
            logger?.log(`[${requestId}] Calling create Table : ${datasetName}`);
            const dataset = await client.create();
            logger?.log(
                `[${requestId}] Create Dataset Complete with data : ${JSON.stringify(
                    dataset.apiResponse
                )}`
            );
        }
        const tableCreateResponse = client.table(tableName).create(tableSchema);
        logger?.log(`[${requestId}] Dataset created Successfully.`);
        return tableCreateResponse;
    }

    async function insertOne<T extends TRow>(
        data: T,
        requestId = generateID()
    ) {
        logger?.log(
            `[${requestId}] Insert Logs called for Table ${tableName} on dataset : ${datasetName}`
        );
        const client = bqClient.dataset(datasetName).table(tableName);
        logger?.log(`[${requestId}] Client for logs insert has been created.`);
        return await client.insert<T>(data, {
            createInsertId: false,
        });
    }

    async function insertMany<T extends TRow>(
        data: Array<{ data: T; insertId?: string }>,
        requestId = generateID()
    ) {
        logger?.log(
            `[${requestId}] Called to insert many logs on table : ${tableName} that exists on dataset : ${datasetName} with ${data.length} Number of Logs.`
        );
        const client = bqClient.dataset(datasetName).table(tableName);
        logger?.log(`[${requestId}] Client Initialized.`);
        const insertStream = client.insertMany<T>(data);
        logger?.log(`[${requestId}] Insert stream created.`);
        return insertStream;
    }

    function exists(requestId = generateID()) {
        logger?.log(
            `[${requestId}] Called to check if table : ${tableName} exists on dataset : ${datasetName}`
        );
        const client = bqClient.dataset(datasetName).table(tableName);
        logger?.log(
            `[${requestId}] Client initialized to check if table exists`
        );
        return client.exists();
    }
    return {
        exists,
        insertMany,
        insertOne,
        createTable,
    };
}

export type CRUD = ReturnType<typeof crud>;
