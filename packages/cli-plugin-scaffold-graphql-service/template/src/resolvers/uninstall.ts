import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import { ApplicationContext } from "../types";

const uninstall = async (_, __, context: ApplicationContext) => {
    const { security, elasticSearch } = context;
    const hasFullAccess = await security.hasFullAccess();
    if (!hasFullAccess) {
        return new ErrorResponse({
            message: "Not authorized.",
            code: "NOT_AUTHORIZED"
        });
    }
    const esConfig = configuration.es(context);
    const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
    if (!hasIndice) {
        return new ErrorResponse({
            message: "Not installed.",
            code: "NOT_INSTALLED"
        });
    }
    try {
        await elasticSearch.indices.delete(esConfig);
    } catch (ex) {
        return new ErrorResponse({
            message: "Could not delete Elasticsearch index.",
            code: "ELASTICSEARCH_ERROR",
            data: ex
        });
    }
    return new Response(true);
};

export default uninstall;
