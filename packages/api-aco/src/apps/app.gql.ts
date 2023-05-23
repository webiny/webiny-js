import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { AcoContext } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import lodashOmit from "lodash/omit";

const cleanModel = (model: CmsModel): Partial<CmsModel> => {
    return lodashOmit(model, [
        "webinyVersion",
        "tags",
        "locale",
        "tenant",
        "layout",
        "group",
        "description",
        "isPrivate"
    ]);
};

export const appGql = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        type AcoApp {
            id: ID!
            name: String!
            model: JSON!
        }
        type GetAppResponse {
            data: AcoApp
            error: AcoError
        }
        type GetAppModelResponse {
            data: JSON
            error: AcoError
        }
        extend type AcoQuery {
            getApp(id: ID!): GetAppResponse!
            getAppModel(id: ID!): GetAppModelResponse!
        }
    `,
    resolvers: {
        AcoQuery: {
            getApp: async (_, args, context) => {
                try {
                    const app = context.aco.getApp(args.id);
                    return new Response({
                        id: args.id,
                        name: app.name,
                        model: cleanModel(app.model)
                    });
                } catch (ex) {
                    return new ErrorResponse(ex);
                }
            },
            getAppModel: async (_, args, context) => {
                try {
                    const app = context.aco.getApp(args.id);
                    return new Response(cleanModel(app.model));
                } catch (ex) {
                    return new ErrorResponse(ex);
                }
            }
        }
    }
});