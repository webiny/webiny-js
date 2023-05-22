import { CmsEntry, CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldResolversFactory } from "@webiny/api-headless-cms/graphql/schema/createFieldResolvers";
import { IAcoApp } from "~/types";
import { resolve, resolveList } from "~/utils/resolve";
import { parseIdentifier } from "@webiny/utils";
import { removeAcoRecordPrefix } from "~/utils/acoRecordId";
import { checkPermissions } from "~/utils/checkPermissions";

interface Params {
    app: IAcoApp;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

interface Resolvers {
    SearchQuery: Record<string, any>;
    SearchMutation: Record<string, any>;
    [key: string]: Record<string, any>;
}

export const createAppResolvers = (params: Params): Resolvers => {
    const { app, models, plugins } = params;

    const model = app.model;
    const apiName = model.singularApiName;

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

    const resolvers: Resolvers = {
        SearchQuery: {
            [`get${apiName}`]: async (_: unknown, args: any) => {
                return resolve(() => {
                    checkPermissions(app.context);
                    return app.search.get(args.id);
                });
            },
            [`list${apiName}`]: async (_: unknown, args: any) => {
                return resolveList(() => {
                    checkPermissions(app.context);
                    return app.search.list(args);
                });
            },
            [`list${apiName}Tags`]: async (_: unknown, args: any) => {
                return resolveList(() => {
                    checkPermissions(app.context);
                    return app.search.listTags(args);
                });
            }
        },
        SearchMutation: {
            [`create${apiName}`]: async (_: unknown, args: any) => {
                return resolve(() => {
                    checkPermissions(app.context);
                    const { id } = parseIdentifier(args.data?.id);
                    return app.search.create({
                        ...args.data,
                        id
                    });
                });
            },
            [`update${apiName}`]: async (_: unknown, args: any) => {
                return resolve(() => {
                    checkPermissions(app.context);
                    const { id } = parseIdentifier(args.id);
                    return app.search.update(id, args.data || {});
                });
            },
            [`delete${apiName}`]: async (_: unknown, args: any) => {
                return resolve(() => {
                    checkPermissions(app.context);
                    const { id } = parseIdentifier(args.id);
                    return app.search.delete(id);
                });
            }
        }
    };

    Object.assign(resolvers, fieldResolvers);
    delete resolvers[apiName].entryId;

    return resolvers;
};
