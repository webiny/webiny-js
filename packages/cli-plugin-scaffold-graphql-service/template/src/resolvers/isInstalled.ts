import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { utils } from "../utils";
import { ApplicationContext } from "../types";
import { NotAuthorizedResponse } from "@webiny/api-security";
/**
 * Install query is to check if Elasticsearch index exists.
 * Can be removed if Elasticsearch is not used.
 */
const isInstalled = async (_, __, context: ApplicationContext) => {
    const { security, elasticSearch } = context;
    /**
     * The user running this code MUST have full access to the system.
     */
    const hasFullAccess = await security.hasFullAccess();
    if (!hasFullAccess) {
        return new NotAuthorizedResponse();
    }
    /**
     * Create the Elasticsearch config to be used in index checking.
     */
    const esConfig = utils.es(context);
    try {
        const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
        /**
         * Just plain true/false to return so user can act on the information.
         */
        return new Response(hasIndice);
    } catch (ex) {
        /**
         * Fail with ErrorResponse on exception.
         */
        return new ErrorResponse({
            message: "Could not check for Elasticsearch index.",
            code: "ELASTICSEARCH_ERROR",
            data: ex
        });
    }
};

export default isInstalled;
