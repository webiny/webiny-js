import { Client } from "@elastic/elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";

interface DeleteElasticsearchIndexParams {
    elasticsearch: Client;
    model: CmsModel;
}

export const deleteElasticsearchIndex = async (
    params: DeleteElasticsearchIndexParams
): Promise<void> => {
    const { elasticsearch, model } = params;

    const { index } = configurations.es({
        model
    });
    const { body: exists } = await elasticsearch.indices.exists({
        index
    });
    if (!exists) {
        return;
    }

    try {
        await elasticsearch.indices.delete({
            index,
            ignore_unavailable: true
        });
    } catch (ex) {
        console.log(`Could not delete Elasticsearch index "${index}". Please do it manually.`);
        console.log(ex.message);
    }
};
