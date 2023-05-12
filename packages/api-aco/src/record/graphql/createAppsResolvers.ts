import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldResolversFactory } from "@webiny/api-headless-cms/graphql/schema/createFieldResolvers";
import { IAcoApp } from "~/types";
import { resolve } from "~/utils/resolve";

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
            return resolve(() => {
                return app.search.list(args);
            });
        };
        resolvers.SearchMutation[`create${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                return app.search.create(args.data || {});
            });
        };
        /**
         * Mutations
         */
        resolvers.SearchMutation[`update${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                return app.search.update(args.id, args.data || {});
            });
        };
        resolvers.SearchMutation[`delete${apiName}`] = async (_: unknown, args: any) => {
            return resolve(() => {
                return app.search.delete(args.id);
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
            isRoot: true
        });

        Object.assign(resolvers, fieldResolvers);
    }

    return resolvers;
};
