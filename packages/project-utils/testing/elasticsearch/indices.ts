import { Client } from "@elastic/elasticsearch";

interface DeleteIndexesParams {
    client: Client;
    prefix: string;
}
export const deleteIndexes = async (params: DeleteIndexesParams) => {
    const { client, prefix } = params;

    /**
     * Prefix MUST exist. we cannot allow going further without the prefix.
     */
    if (!prefix) {
        throw new Error("process.env.ELASTIC_SEARCH_INDEX_PREFIX is not set!");
    }

    const response = await client.cat.indices({
        format: "json"
    });
    if (!response.body) {
        return;
    }
    const re = new RegExp(`^${prefix}`);
    const items: string[] = Object.values(response.body)
        .map(item => {
            return item.index;
        })
        .filter(index => {
            if (!prefix) {
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
        console.log(`Deleted indexes: ${items.join(", ")}`);
    } catch (ex) {
        console.log(ex.message);
        // throw ex;
    }
};
