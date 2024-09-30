import WebinyError from "@webiny/error";

interface LogIgnoredElasticsearchExceptionParams {
    error: WebinyError;
    indexName: string;
}

export const logIgnoredEsResponseError = (params: LogIgnoredElasticsearchExceptionParams) => {
    const { error, indexName } = params;
    if (process.env.DEBUG !== "true") {
        return;
    }
    console.log(`Ignoring Elasticsearch response error: ${error.message}`, {
        usedIndexName: indexName,
        error: {
            ...error,
            message: error.message,
            code: error.code,
            data: error.data,
            stack: error.stack
        }
    });
};
