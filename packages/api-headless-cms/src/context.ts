import type { ApiEndpoint, CmsContext } from "~/types/index.js";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { processRequestBody } from "@webiny/handler-graphql";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";
import { CmsExport, CmsImport } from "~/export/abstractions.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
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
    StorageOperations,
    StorageOperationsFactory
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
import { GraphQLFeature } from "~/features/graphql/index.js";
import { ValidationFeature } from "~/features/validation/index.js";
import { StorageFeature } from "~/features/storage/index.js";
import { CmsWebhooksFeature } from "~/features/webhooks/feature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

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

export const createContextPlugin = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const { type } = await getParameters(context);

        const getTenant = () => {
            return context.container.resolve(TenantContext).getTenant();
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

        // TODO figure out a better way. maybe this stuff should be on before handler?
        // GraphQL fields must be loaded before anything else
        GraphQLFeature.register(context.container);
        ValidationFeature.register(context.container);
        StorageFeature.register(context.container);

        context.plugins.register(
            new StorageOperationsCmsModelPlugin(createCmsModelFieldConvertersAttachFactory(context))
        );

        const identityContext = context.container.resolve(IdentityContext);
        const accessControl = new AccessControl({
            getIdentity: async () => identityContext.getIdentity(),
            getGroupsPermissions: () => identityContext.getPermissions("cms.contentModelGroup"),
            getModelsPermissions: () => identityContext.getPermissions("cms.contentModel"),
            getEntriesPermissions: () => identityContext.getPermissions("cms.contentEntry"),
            listAllGroups: async () => {
                const result = await identityContext.withoutAuthorization(() =>
                    context.container.resolve(ListGroupsUseCase).execute()
                );
                if (result.isFail()) {
                    throw result.error;
                }
                return result.value;
            }
        });

        const storageOperationsFactory = context.container.resolve(StorageOperationsFactory);

        const storageOperations = await storageOperationsFactory.create(context);
        await storageOperations.beforeInit(context);

        context.cms = {
            type,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage",
            storageOperations,
            accessControl,
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

        context.container.registerInstance(CmsExport, context.cms.export);
        context.container.registerInstance(CmsImport, context.cms.importing);

        context.container.registerInstance(CmsSchemaExecutor, {
            execute: async (schemaType: ApiEndpoint, body) => {
                const originalType = context.cms.type;
                setSchemaType(schemaType);
                const schema = await context.container
                    .resolve(IdentityContext)
                    .withoutAuthorization(() => {
                        return getSchema({ context, getTenant, type: schemaType });
                    });
                setSchemaType(originalType);
                return processRequestBody(body, schema, context);
            }
        });

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
                context,
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
        CmsWebhooksFeature.register(context.container);

        if (!storageOperations.init) {
            return;
        }
        await storageOperations.init(context);
    });

    plugin.name = "cms.createContext";

    return plugin;
};
