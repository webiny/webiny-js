import { ApiEndpoint, CmsContext, HeadlessCmsStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { GraphQLRequestBody } from "@webiny/handler-graphql/types";
import { processRequestBody } from "@webiny/handler-graphql";
import { CmsParametersPlugin, CmsParametersPluginResponse } from "~/plugins/CmsParametersPlugin";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { createSystemCrud } from "~/crud/system.crud";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/crud/contentModel.crud";
import { createContentEntryCrud } from "~/crud/contentEntry.crud";
import { StorageOperationsCmsModelPlugin } from "~/plugins";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter";
import { createExportCrud } from "~/export";
import { createImportCrud } from "~/export/crud/importing";
import { getSchema } from "~/graphql/getSchema";

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

        if (localeCode) {
            const locale = context.i18n.getLocale(localeCode);
            if (locale) {
                context.i18n.setContentLocale(locale);
            }
        }

        const getLocale = () => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError("Missing content locale in cms context.ts.", "LOCALE_ERROR");
            }
            return locale;
        };

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
                getIdentity: context.security.getIdentity,
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
