import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";

const createTypeDefs = (models: CmsModel[], manage?: boolean): string => {
    const base: string[] = [
        /* GraphQL */ `
            type Wby_Location {
                folderId: ID
            }
        `
    ];
    if (manage) {
        base.push(`
            # Creation of the entry
            input Wby_LocationInput {
                folderId: ID!
            }
            # Filtering
            input Wby_ListWhereMetaLocationInput {
                folderId: ID
            }
            input Wby_ListWhereMetaInput {
                location: Wby_ListWhereMetaLocationInput
            }
        `);
    }
    return base
        .concat(
            models.reduce<string[]>((collection, model) => {
                if (manage) {
                    collection.push(/* GraphQL */ `
                        extend input ${model.singularApiName}Input {
                            wby_location: Wby_LocationInput!
                        }
                        
                        extend input ${model.singularApiName}ListWhereInput {
                            meta: Wby_ListWhereMetaInput
                        }
                    `);
                }
                collection.push(/* GraphQL */ `
                    extend type ${model.singularApiName}Meta {
                        location: Wby_Location
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
