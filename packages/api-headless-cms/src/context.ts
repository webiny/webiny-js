import type { ApiEndpoint, CmsContext, HeadlessCmsStorageOperations } from "~/types/index.js";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import type { GraphQLRequestBody } from "@webiny/handler-graphql/types.js";
import { processRequestBody } from "@webiny/handler-graphql";
import type { CmsParametersPluginResponse } from "~/plugins/CmsParametersPlugin.js";
import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin.js";
import { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import { createSystemCrud } from "~/crud/system.crud.js";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud.js";
import { createModelsCrud } from "~/crud/contentModel.crud.js";
import { createContentEntryCrud } from "~/crud/contentEntry.crud.js";
import { StorageOperationsCmsModelPlugin } from "~/plugins/index.js";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter.js";
import { createExportCrud } from "~/export/index.js";
import { createImportCrud } from "~/export/crud/importing.js";
import { getSchema } from "~/graphql/getSchema.js";
import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";

const getParameters = async (context: CmsContext): Promise<CmsParametersPluginResponse> => {
    const plugins = context.plugins.byType<CmsParametersPlugin>(CmsParametersPlugin.type);

    for (const plugin of plugins) {
        const result = await plugin.getParameters(context);
        if (result !== null) {
            return result;
        }
    }
    throw new WebinyError(
        "Could not determine locale and/or type of the CMS.",
        "CMS_LOCALE_AND_TYPE_ERROR"
    );
};

export interface CrudParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createContextPlugin = ({ storageOperations }: CrudParams) => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const { type, locale: localeCode } = await getParameters(context);

        const getIdentity = () => {
            return context.security.getIdentity();
        };

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
                    getLocale,
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

        await context.benchmark.measure("headlessCms.createContext", async () => {
            await storageOperations.beforeInit(context);

            const accessControl = new AccessControl({
                getIdentity: () => context.security.getIdentity(),
                getGroupsPermissions: () =>
                    context.security.getPermissions("cms.contentModelGroup"),
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
                locale: localeCode,
                getLocale,
                READ: type === "read",
                PREVIEW: type === "preview",
                MANAGE: type === "manage",
                storageOperations,
                accessControl,
                getExecutableSchema,
                ...createSystemCrud({
                    context,
                    getTenant,
                    getLocale,
                    getIdentity,
                    storageOperations
                }),
                ...createModelGroupsCrud({
                    context,
                    getTenant,
                    getLocale,
                    getIdentity,
                    storageOperations,
                    accessControl
                }),
                ...createModelsCrud({
                    context,
                    getLocale,
                    getTenant,
                    getIdentity,
                    storageOperations,
                    accessControl
                }),
                ...createContentEntryCrud({
                    context,
                    getIdentity,
                    getTenant,
                    getLocale,
                    storageOperations,
                    accessControl
                }),
                export: {
                    ...createExportCrud(context)
                },
                importing: {
                    ...createImportCrud(context)
                }
            };

            if (!storageOperations.init) {
                return;
            }
            await storageOperations.init(context);
        });
    });

    plugin.name = "cms.createContext";

    return plugin;
};
