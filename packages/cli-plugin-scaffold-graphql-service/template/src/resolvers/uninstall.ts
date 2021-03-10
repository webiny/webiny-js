import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { utils } from "../utils";
import { ApplicationContext } from "../types";
/**
 * Uninstall mutation is Elasticsearch index deletion.
 * Can be removed if Elasticsearch is not used.
 */
const uninstall = async (_, __, context: ApplicationContext) => {
    const { security, elasticSearch } = context;
    /**
     * The user running this code MUST have full access to the system.
     */
    const hasFullAccess = await security.hasFullAccess();
    if (!hasFullAccess) {
        return new ErrorResponse({
            message: "Not authorized.",
            code: "NOT_AUTHORIZED"
        });
    }
    /**
     * Create the Elasticsearch config to be used in index deletion.
     */
    const esConfig = utils.es(context);
    /**
     * We need to check if given index already exists. If it does not it means that there is no need to proceed.
     * Fail with response in that case.
     */
    const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
    if (!hasIndice) {
        return new ErrorResponse({
            message: "Not installed.",
            code: "NOT_INSTALLED"
        });
    }
    /**
     * Try to delete the Elasticsearch index.
     * Fail with ErrorResponse on any error.
     */
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
