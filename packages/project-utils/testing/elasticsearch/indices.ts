import { Client } from "@elastic/elasticsearch";

interface DeleteIndexesParams {
    client: Client;
    indices: string[];
}
export const deleteIndexes = async (params: DeleteIndexesParams) => {
    const { client, indices } = params;

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
            return indices.includes(index);
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
