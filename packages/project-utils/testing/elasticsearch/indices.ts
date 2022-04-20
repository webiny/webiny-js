import { Client } from "@elastic/elasticsearch";

const defaultPrefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;

interface DeleteAllIndexesParams {
    client: Client;
    prefix?: string;
}
export const deleteAllIndexes = async (params: DeleteAllIndexesParams) => {
    const { client, prefix = defaultPrefix } = params;

    const re = new RegExp(`^${prefix}`);
    const response = await client.cat.indices();
    if (!response.body) {
        return;
    }
    const indexes: string[] = Object.values(response.body)
        .map(({ index }) => {
            return index;
        })
        .filter(index => {
            return index.match(re) !== null;
        });
    if (indexes.length === 0) {
        return;
    }

    try {
        await client.indices.delete({
            index: indexes
        });
    } catch (ex) {
        console.log(ex.message);
        throw ex;
    }
};
