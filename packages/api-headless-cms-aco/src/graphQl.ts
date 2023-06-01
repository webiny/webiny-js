import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";

const createTypeDefs = (models: CmsModel[]): string => {
    return [
        /* GraphQL */ `
            type WbyLocation {
                folderId: ID
            }
        `
    ]
        .concat(
            models.map(model => {
                return /* GraphQL */ `
                extend type ${model.singularApiName}Meta {
                    location: WbyLocation
                }
            `;
            })
        )
        .join("\n");
};

const createResolvers = (models: CmsModel[]) => {
    return models.reduce<Record<string, any>>((resolvers, model) => {
        resolvers[`${model.singularApiName}Meta`] = {
            location: async (entry: CmsEntry) => {
                return entry.meta?.location || null;
            }
        };

        return resolvers;
    }, {});
};

export const extendHeadlessCmsGraphQL = async (context: CmsContext): Promise<void> => {
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => !model.isPrivate);
    });

    const plugin = new CmsGraphQLSchemaPlugin({
        typeDefs: createTypeDefs(models),
        resolvers: createResolvers(models)
    });

    plugin.name = `headless-cms-aco.extend-headless-cms-graphql`;

    context.plugins.register(plugin);
};
