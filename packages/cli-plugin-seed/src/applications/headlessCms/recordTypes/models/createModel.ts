import { GraphQLClient } from "graphql-request";
import { CmsModel } from "~/applications/headlessCms/graphql/types";
import { Logger } from "~/types";
import { createInsertModelMutation } from "~/applications/headlessCms/graphql";
import { ModelBuilder } from "~/applications/headlessCms/builders/ModelBuilder";
import { updateModel } from "./updateModel";

interface Params {
    client: GraphQLClient;
    builder: ModelBuilder;
    log: Logger;
}

export const createModel = async (params: Params): Promise<CmsModel> => {
    const { client, builder, log } = params;

    const mutation = createInsertModelMutation();

    let response;
    try {
        response = await client.request(mutation, {
            data: builder.buildCreateInputData()
        });
    } catch (ex) {
        log.red(ex.message);
        return null;
    }
    if (!response.data) {
        log.red(`Could not create model. Missing response.`);
        return null;
    }
    const { data: model, error } = response?.data?.createContentModel || {};
    if (!model) {
        log.red(error?.message);
        log.red(`Could not create new model. Missing data.createContentModel response.`);
        return null;
    }

    if (builder.hasFields() === false) {
        return model;
    }

    return updateModel({
        ...params,
        model
    });
};
