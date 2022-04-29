import { Client } from "@elastic/elasticsearch";

interface DeleteIndexesParams {
    client: Client;
    prefix: string;
}
export const deleteIndexes = async (params: DeleteIndexesParams) => {
    const { client, prefix } = params;

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
    } catch (ex) {
        console.log(ex.message);
        throw ex;
    }
};
