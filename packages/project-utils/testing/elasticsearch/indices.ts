import { Client } from "@elastic/elasticsearch";

const defaultPrefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

interface DeleteIndexesParams {
    client: Client;
    indices?: string[];
    prefix?: string;
}
export const deleteIndexes = async (params: DeleteIndexesParams) => {
    const { client, indices, prefix = defaultPrefix } = params;

    const re = prefix ? new RegExp(`^${prefix}`) : null;
    const response = await client.cat.indices({
        format: "json"
    });
    if (!response.body) {
        return;
    }
    const items: string[] = Object.values(response.body)
        .map(item => {
            return item.index;
        })
        .filter(index => {
            if (indices) {
                return indices.includes(index);
            } else if (!re) {
                return true;
            }
            return index.match(re) !== null;
        });
    if (items.length === 0) {
        return;
    }

    try {
        await client.indices.delete({
            index: items
        });
    } catch (ex) {
        console.log(ex.message);
        throw ex;
    }
};
