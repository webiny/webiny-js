import { CmsModel } from "~/applications/headlessCms/graphql/types";
import { GraphQLClient } from "graphql-request";
import { Logger } from "~/types";
import { createGetModelQuery } from "~/applications/headlessCms/graphql";

export interface Params {
    client: GraphQLClient;
    modelId: string;
    log: Logger;
}
export const getModel = async (params: Params): Promise<CmsModel> => {
    const { client, modelId, log } = params;

    const query = createGetModelQuery();

    let response;
    try {
        response = await client.request(query, {
            modelId
        });
    } catch (ex) {
        log.red(ex.message);
        return null;
    }
    if (!response.data) {
        log.red(`Could not create model. Missing response.`);
        return null;
    }
    const { data: model, error } = response?.data?.contentModel || {};
    if (!model) {
        log.red(error?.message);
        log.red(`Could not create new model. Missing data.contentModel response.`);
        return null;
    }
    return model;
};
