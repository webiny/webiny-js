import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import { ApplicationContext } from "../types";

const isInstalled = async (_, __, context: ApplicationContext) => {
    const { security, elasticSearch } = context;
    const hasFullAccess = await security.hasFullAccess();
    if (!hasFullAccess) {
        return new ErrorResponse({
            message: "Not authorized.",
            code: "NOT_AUTHORIZED"
        });
    }
    try {
        const esConfig = configuration.es(context);
        const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
        return new Response(hasIndice);
    } catch (ex) {
        return new ErrorResponse({
            message: "Could not check for Elasticsearch index.",
            code: "ELASTICSEARCH_ERROR",
            data: ex
        });
    }
};

export default isInstalled;
