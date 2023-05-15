import { CmsEntry, CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldResolversFactory } from "@webiny/api-headless-cms/graphql/schema/createFieldResolvers";
import { IAcoApp } from "~/types";
import { resolve, resolveList } from "~/utils/resolve";
import { parseIdentifier } from "@webiny/utils";
import { removeAcoRecordPrefix } from "~/utils/acoRecordId";

interface Params {
    apps: IAcoApp[];
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

interface Resolvers {
    SearchQuery: Record<string, any>;
    SearchMutation: Record<string, any>;
    [key: string]: Record<string, any>;
}

export const createAppsResolvers = (params: Params): Resolvers => {
    const { apps, models, plugins } = params;

    const resolvers: Resolvers = {
        SearchQuery: {},
        SearchMutation: {}
    };

    for (const app of apps) {
        const model = app.model;
        const apiName = model.singularApiName;

        /**
         * Queries
         */
        resolvers.SearchQuery[`get${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                return app.search.get(args.id);
            });
        };
        resolvers.SearchQuery[`list${apiName}`] = async (_: unknown, args: any) => {
            return resolveList(() => {
                return app.search.list(args);
            });
        };
        /**
         * Mutations
         */
        resolvers.SearchMutation[`create${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                const { id } = parseIdentifier(args.data?.id);
                return app.search.create({
                    ...args.data,
                    id
                });
            });
        };
        resolvers.SearchMutation[`update${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                const { id } = parseIdentifier(args.id);
                return app.search.update(id, args.data || {});
            });
        };
        resolvers.SearchMutation[`delete${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                const { id } = parseIdentifier(args.id);
                return app.search.delete(id);
            });
        };
        const createFieldResolvers = createFieldResolversFactory({
            endpointType: "manage",
            models,
            model,
            fieldTypePlugins: plugins
        });

        const fieldResolvers = createFieldResolvers({
            graphQLType: apiName,
            fields: app.model.fields,
            isRoot: true,
            extraResolvers: {
                id: (entry: CmsEntry) => {
                    const { id } = parseIdentifier(entry.id);
                    return removeAcoRecordPrefix(id);
                }
            }
        });

        Object.assign(resolvers, fieldResolvers);
        delete resolvers[apiName].entryId;
    }

    return resolvers;
};
