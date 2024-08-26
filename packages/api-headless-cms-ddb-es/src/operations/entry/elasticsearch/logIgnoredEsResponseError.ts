import WebinyError from "@webiny/error";
import { CmsModel } from "@webiny/api-headless-cms/types";

interface LogIgnoredElasticsearchExceptionParams {
    error: WebinyError;
    model: CmsModel;
    indexName: string;
}

export const logIgnoredEsResponseError = (params: LogIgnoredElasticsearchExceptionParams) => {
    const { error, indexName, model } = params;

    console.log(`Ignoring Elasticsearch response error: ${error.message}`, {
        modelId: model.modelId,
        usedIndexName: indexName,
        error: {
            message: error.message,
            code: error.code,
            data: error.data,
            stack: error.stack
        }
    });
};
