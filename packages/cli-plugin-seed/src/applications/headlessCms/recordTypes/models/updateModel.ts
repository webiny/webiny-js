import { CmsModel } from "~/applications/headlessCms/graphql/types";
import { createUpdateModelMutation } from "~/applications/headlessCms/graphql";
import { GraphQLClient } from "graphql-request";
import { ModelBuilder } from "~/applications/headlessCms/builders/ModelBuilder";
import { Logger } from "~/types";

export interface Params {
    client: GraphQLClient;
    builder: ModelBuilder;
    log: Logger;
    model: CmsModel;
}
export const updateModel = async (params: Params): Promise<CmsModel> => {
    const { client, builder, log, model: targetModel } = params;

    const mutation = createUpdateModelMutation();

    let response;
    try {
        response = await client.request(mutation, {
            modelId: targetModel.modelId,
            data: builder.buildUpdateInputData()
        });
    } catch (ex) {
        log.red(ex.message);
        return null;
    }
    if (!response.data) {
        log.red(`Could not create model. Missing response.`);
        return null;
    }
    const { data: model, error } = response?.data?.updateContentModel || {};
    if (!model) {
        log.red(error?.message);
        log.red(`Could not update model. Missing data.updateContentModel response.`);
        return null;
    }
    return model;
};
