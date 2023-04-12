import {
    BigQuery,
    BigQueryOptions,
    InsertRowsOptions,
    Query,
} from '@google-cloud/bigquery';
import { checkIfDatasetExists, createDataset } from './create-dataset';
import { queryDataset } from './query-dataset';
import {
    checkIfTableExists,
    createManyRecordInTable,
    createRecordInTable,
    createTable,
    queryFromTable,
} from './table';
import { Logger, Schema, TRow } from './types';

function createBigQueryClient(options?: BigQueryOptions, logger?: Logger) {
    logger?.log(`Called Initiate BigQueryClient`);
    const bigqueryClient = new BigQuery(options);
    logger?.log(
        `Initialized bigquery client with resource, ${JSON.stringify({
            location: bigqueryClient.location,
            projectId: bigqueryClient.projectId,
            userAgent: bigqueryClient.providedUserAgent,
            baseUrl: bigqueryClient.baseUrl,
            scopes: bigqueryClient.authClient.defaultScopes,
        })}`
    );

    return {
        dataset: (datasetName: string) => ({
            create: () => createDataset(bigqueryClient, datasetName),
            exists: () => checkIfDatasetExists(bigqueryClient, datasetName),
            query: <T extends TRow>(query: string) =>
                queryDataset<T>(bigqueryClient, query),
            table: (tableName: string) => ({
                create: (schema: Schema) =>
                    createTable(
                        bigqueryClient,
                        {
                            datasetName,
                            tableName,
                        },
                        schema
                    ),
                exists: () =>
                    checkIfTableExists(bigqueryClient, {
                        datasetName,
                        tableName,
                    }),
                query: (query: Query) =>
                    queryFromTable(
                        bigqueryClient,
                        {
                            datasetName,
                            tableName,
                        },
                        query
                    ),
                insert: <T extends TRow>(
                    record: T,
                    options: InsertRowsOptions
                ) =>
                    createRecordInTable(bigqueryClient, {
                        datasetName,
                        tableName,
                        record,
                        options,
                    }),
                insertMany: <T extends TRow>(
                    records: Array<{ data: T; insertId?: string }>
                ) =>
                    createManyRecordInTable(bigqueryClient, {
                        datasetName,
                        tableName,
                        records,
                    }),
            }),
        }),
    };
}
type BigQueryClient = Awaited<ReturnType<typeof createBigQueryClient>>;
export { createBigQueryClient, BigQueryClient };
