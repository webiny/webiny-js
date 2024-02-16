import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";

import {
    createFormStatsTypeDefs,
    CreateFormStatsTypeDefsParams
} from "~/plugins/graphql/createFormStatsTypeDefs";
import { FormBuilderContext } from "~/types";

export const createFormStatsSchema = (params: CreateFormStatsTypeDefsParams) => {
    const formStatsGraphQL = new GraphQLSchemaPlugin<FormBuilderContext>({
        typeDefs: createFormStatsTypeDefs(params),
        resolvers: {
            FbQuery: {
                getFormStats: async (_, args: any, { formBuilder }) => {
                    try {
                        const formStats = await formBuilder.getFormStats(args.formId);

                        return new Response(formStats);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getFormOverallStats: async (_, args: any, { formBuilder }) => {
                    try {
                        const formStats = await formBuilder.getFormOverallStats(args.formId);

                        return new Response(formStats);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    formStatsGraphQL.name = "fb.graphql.formStats";

    return formStatsGraphQL;
};
