import { Client } from "@elastic/elasticsearch";

export interface ListIndexesParams {
    elasticsearchClient: Client;
    match?: string;
}

type IndicesApiResponse = Array<Record<string, string>>;

export const esListIndexes = async (params: ListIndexesParams): Promise<string[]> => {
    const { elasticsearchClient } = params;

    const response = await elasticsearchClient.cat.indices<IndicesApiResponse>({
        format: "json"
    });

    const listOfIndexes = response.body.map(item => item.index);

    const match = params.match;
    if (match) {
        return listOfIndexes.filter(index => index.includes(match));
    }

    return listOfIndexes;
};
