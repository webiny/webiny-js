import { Client } from "@elastic/elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";

interface DeleteElasticsearchIndexParams {
    client: Client;
    model: CmsModel;
}

export const deleteElasticsearchIndex = async (
    params: DeleteElasticsearchIndexParams
): Promise<void> => {
    const { client, model } = params;

    const { index } = configurations.es({
        model
    });
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
