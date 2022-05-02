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
    const indexes: string[] = Object.values(response.body)
        .map(item => {
            return item.index;
        })
        .filter(index => {
            return index.match(re) !== null;
        });
    if (indexes.length === 0) {
        return;
    }

    for (const index of indexes) {
        try {
            console.log(`Deleting index "${index}" ...`);
            await client.indices.delete({
                index
            });
            console.log("... success");
        } catch (ex) {
            console.log("... error");
            console.log(JSON.stringify(ex));
        }
    }
};
