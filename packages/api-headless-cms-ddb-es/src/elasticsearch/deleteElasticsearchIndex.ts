import type { Client } from "@webiny/api-opensearch";
import type { Configurations } from "~/configurations.js";
import type { ICmsModelOpenSearchIndexModel } from "~/features/CmsModelOpenSearchIndex/abstractions.js";

interface DeleteElasticsearchIndexParams {
    client: Client;
    configurations: Configurations;
    model: ICmsModelOpenSearchIndexModel;
}

export const deleteElasticsearchIndex = async (
    params: DeleteElasticsearchIndexParams
): Promise<void> => {
    const { client, model } = params;

    const { index, shared } = await params.configurations.es({ model });

    if (shared) {
        return;
    }

    const { body: exists } = await client.indices.exists({
        index
    });
    if (!exists) {
        return;
    }

    try {
        await client.indices.delete({
            index,
            ignore_unavailable: true
        });
    } catch (ex) {
        console.log(`Could not delete Elasticsearch index "${index}". Please do it manually.`);
        console.log(ex.message);
    }
};
