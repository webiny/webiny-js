import type { ApiEndpoint, CmsContext, HeadlessCmsStorageOperations } from "~/types/index.js";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import type { GraphQLRequestBody } from "@webiny/handler-graphql/types.js";
import { processRequestBody } from "@webiny/handler-graphql";
import type { CmsParametersPluginResponse } from "~/plugins/CmsParametersPlugin.js";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin.js";
import { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud.js";
import { createModelsCrud } from "~/crud/contentModel.crud.js";
import { createContentEntryCrud } from "~/crud/contentEntry.crud.js";
import { StorageOperationsCmsModelPlugin } from "~/plugins/index.js";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter.js";
import { createExportCrud } from "~/export/index.js";
import { createImportCrud } from "~/export/crud/importing.js";
import { getSchema } from "~/graphql/getSchema.js";
import { CmsInstallerFeature } from "~/features/installer/feature.js";
import { ContentEntriesFeature } from "~/features/contentEntry/ContentEntriesFeature.js";
import {
    AccessControl as AccessControlAbstraction,
    CmsContext as CmsContextAbstraction,
    StorageOperations
} from "~/features/shared/abstractions.js";
import {
    EntryFromStorageTransform,
    EntryToStorageTransform,
    PluginsContainer,
    SearchableFieldsProvider
} from "./legacy/abstractions.js";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage.js";
import { getSearchableFields } from "~/crud/contentEntry/searchableFields.js";
import { ContentModelGroupFeature } from "~/features/contentModelGroup/ContentModelGroupFeature.js";
import { ContentModelFeature } from "~/features/contentModel/ContentModelFeature.js";
import { ModelBuilderFeature } from "~/features/modelBuilder/index.js";
import { CmsWhereMapperFeature } from "~/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "~/features/sortMapper/feature.js";
import Settings from "~/settingsModel.js";

const getParameters = async (context: CmsContext): Promise<CmsParametersPluginResponse> => {
    const plugins = context.plugins.byType<CmsParametersPlugin>(CmsParametersPlugin.type);

    for (const plugin of plugins) {
        const result = await plugin.getParameters(context);
        if (result !== null) {
            return result;
        }
    }
    throw new WebinyError("Could not determine type of the CMS.", "CMS_TYPE_ERROR");
};

export interface CrudParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createContextPlugin = ({ storageOperations }: CrudParams) => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const { type } = await getParameters(context);

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        const setSchemaType = (type: ApiEndpoint | null) => {
            if (!type) {
                return;
            }

            context.cms.type = type;

            switch (type) {
                case "read":
                    context.cms.READ = true;
                    break;
                case "preview":
                    context.cms.PREVIEW = true;
                    break;
                default:
                    context.cms.MANAGE = true;
            }
        };

        async function getExecutableSchema(type: ApiEndpoint) {
            const originalType = context.cms.type;
            setSchemaType(type);

            const schema = await context.security.withoutAuthorization(() => {
                return getSchema({
                    context,
                    getTenant,
                    type
                });
            });

            setSchemaType(originalType);

            return async <TData, TExtensions>(input: GraphQLRequestBody | GraphQLRequestBody[]) => {
                return processRequestBody<TData, TExtensions>(input, schema, context);
            };
        }

        context.plugins.register(
            new StorageOperationsCmsModelPlugin(
                createCmsModelFieldConvertersAttachFactory(context.plugins)
            )
        );

        await storageOperations.beforeInit(context);

        const accessControl = new AccessControl({
            getIdentity: async () => context.security.getIdentity(),
            getGroupsPermissions: () => context.security.getPermissions("cms.contentModelGroup"),
            getModelsPermissions: () => context.security.getPermissions("cms.contentModel"),
            getEntriesPermissions: () => context.security.getPermissions("cms.contentEntry"),
            listAllGroups: () => {
                return context.security.withoutAuthorization(() => {
                    return context.cms.listGroups();
                });
            }
        });

        context.cms = {
            type,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage",
            storageOperations,
            accessControl,
            getExecutableSchema,
            ...createModelGroupsCrud({
                context
            }),
            ...createModelsCrud({
                context
            }),
            ...createContentEntryCrud({
                context
            }),
            export: {
                ...createExportCrud(context)
            },
            importing: {
                ...createImportCrud(context)
            }
        };

        // Register legacy dependencies
        context.container.registerInstance(StorageOperations, storageOperations);
        context.container.registerInstance(AccessControlAbstraction, accessControl);
        context.container.registerInstance(CmsContextAbstraction, context);
        context.container.registerInstance(PluginsContainer, context.plugins);
        context.container.registerInstance(EntryToStorageTransform, (model, entry) => {
            return entryToStorageTransform(context, model, entry);
        });
        context.container.registerInstance(EntryFromStorageTransform, (model, entry) => {
            return entryFromStorageTransform(context, model, entry);
        });
        context.container.registerInstance(SearchableFieldsProvider, params => {
            return getSearchableFields({
                plugins: context.plugins,
                fields: params.fields,
                input: []
            });
        });

        // Register features
        CmsInstallerFeature.register(context.container);
        ContentEntriesFeature.register(context.container);
        ContentModelFeature.register(context.container);
        ContentModelGroupFeature.register(context.container);
        ModelBuilderFeature.register(context.container);

        CmsWhereMapperFeature.register(context.container);
        CmsSortMapperFeature.register(context.container);

        context.container.register(Settings);

        if (!storageOperations.init) {
            return;
        }
        await storageOperations.init(context);
    });

    plugin.name = "cms.createContext";

    return plugin;
};
