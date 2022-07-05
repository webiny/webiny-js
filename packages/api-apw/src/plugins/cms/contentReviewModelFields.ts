import { ApwContext } from "~/types";
import { CONTENT_REVIEW_MODEL_ID } from "~/storageOperations/models/contentReview.model";
import { CmsEntryFieldFilterPathPlugin } from "@webiny/api-headless-cms-ddb/plugins/CmsEntryFieldFilterPathPlugin";

export const createContentReviewModelFields = (context: ApwContext) => {
    const plugins = [];
    /**
     * There is a possibility that this is Elasticsearch deployment.
     * At that point add Elasticsearch fields.
     * We are not using CmsEntryElasticsearchFieldPlugin because we would need to import @webiny/api-headless-cms-ddb-es.
     * // TODO figure out how to push this plugin only on Elasticsearch deployment.
     */
    if ((context as any).elasticsearch) {
        plugins.push({
            type: "elasticsearch.fieldDefinition.cms.entry",
            field: "appType",
            modelId: CONTENT_REVIEW_MODEL_ID,
            path: "content.type"
        });
    }
    plugins.push(
        new CmsEntryFieldFilterPathPlugin({
            path: "content.type",
            fieldId: ["appType"],
            fieldType: "text"
        })
    );

    context.plugins.register(plugins);
};
