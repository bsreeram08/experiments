import { BigQuery, Dataset } from '@google-cloud/bigquery';
import bigquery from '@google-cloud/bigquery/build/src/types';

export function createDataset(
    bigqueryClient: BigQuery,
    datasetName: string
): Promise<{ dataset: Dataset; apiResponse: bigquery.IDataset }> {
    return bigqueryClient
        .createDataset(datasetName)
        .then((v) => ({ dataset: v[0], apiResponse: v[1] }));
}

export function checkIfDatasetExists(
    bigqueryClient: BigQuery,
    datasetName: string
): Promise<boolean> {
    return bigqueryClient
        .dataset(datasetName)
        .exists()
        .then((v) => v[0]);
}
