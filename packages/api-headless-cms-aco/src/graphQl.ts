import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";

const createTypeDefs = (models: CmsModel[], manage?: boolean): string => {
    const base: string[] = [
        /* GraphQL */ `
            type WbyLocation {
                folderId: ID
            }
        `
    ];
    if (manage) {
        base.push(`
            input WbyMetaLocationInput {
                folderId: ID
            }
            input WbyMetaInput {
                location: WbyMetaLocationInput
            }
        `);
    }
    return base
        .concat(
            models.reduce<string[]>((collection, model) => {
                if (manage) {
                    collection.push(/* GraphQL */ `
                        extend input ${model.singularApiName}ListWhereInput {
                            meta: WbyMetaInput
                        }
                    `);
                }
                collection.push(/* GraphQL */ `
                    extend type ${model.singularApiName}Meta {
                        location: WbyLocation
                    }
                `);

                return collection;
            }, [])
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
        typeDefs: createTypeDefs(models, context.cms.type === "manage"),
        resolvers: createResolvers(models)
    });

    plugin.name = `headless-cms-aco.extend-headless-cms-graphql`;

    context.plugins.register(plugin);
};
