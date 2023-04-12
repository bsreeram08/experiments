import { BigQuery, Query } from '@google-cloud/bigquery';
import bigquery from '@google-cloud/bigquery/build/src/types';

export function queryDataset<
    TRow extends Record<string, unknown> = Record<string, unknown>
>(
    bigqueryClient: BigQuery,
    query: string
): Promise<{
    response: Array<TRow>;
    query: Query | null | undefined;
    resultDetails: bigquery.IGetQueryResultsResponse | undefined;
}> {
    return bigqueryClient.query(query).then((v) => ({
        response: v[0],
        query: v[1],
        resultDetails: v[2],
    }));
}
