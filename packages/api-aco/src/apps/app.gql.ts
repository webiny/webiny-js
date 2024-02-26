import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { AcoContext } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import lodashOmit from "lodash/omit";
import { ensureAuthentication } from "~/utils/ensureAuthentication";
import { resolve } from "~/utils/resolve";

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
                return resolve(async () => {
                    ensureAuthentication(context);
                    const app = context.aco.getApp(args.id);
                    return {
                        id: args.id,
                        name: app.name,
                        model: cleanModel(app.model)
                    };
                });
            },
            getAppModel: async (_, args, context) => {
                return resolve(async () => {
                    ensureAuthentication(context);
                    const app = context.aco.getApp(args.id);
                    return cleanModel(app.model);
                });
            }
        }
    }
});
