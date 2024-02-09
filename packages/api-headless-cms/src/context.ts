import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { CmsParametersPlugin, CmsParametersPluginResponse } from "~/plugins/CmsParametersPlugin";
import { AccessControl } from "~/crud/AccessControl";
import { createSystemCrud } from "~/crud/system.crud";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/crud/contentModel.crud";
import { createContentEntryCrud } from "~/crud/contentEntry.crud";
import { StorageOperationsCmsModelPlugin } from "~/plugins";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter";
import { createExportCrud } from "~/export";
import { createImportCrud } from "~/export/crud/importing";

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
        const { type, locale } = await getParameters(context);

        const getLocale = () => {
            const systemLocale = context.i18n.getLocale(locale);
            if (!systemLocale) {
                throw new WebinyError(`There is no locale "${locale}" in the system.`);
            }
            return systemLocale;
        };

        const getIdentity = () => {
            return context.security.getIdentity();
        };

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        context.plugins.register(
            new StorageOperationsCmsModelPlugin(
                createCmsModelFieldConvertersAttachFactory(context.plugins)
            )
        );

        await context.benchmark.measure("headlessCms.createContext", async () => {
            await storageOperations.beforeInit(context);

            const accessControl = new AccessControl({
                getIdentity: context.security.getIdentity,
                getGroupsPermissions: () => context.security.getPermissions("cms.contentModelGroup"),
                getModelsPermissions: () => context.security.getPermissions("cms.contentModel"),
                getEntriesPermissions: () => context.security.getPermissions("cms.contentEntry"),
                listAllGroups: () => {
                    return context.security.withoutAuthorization(() => {
                        return context.cms.listGroups();
                    })
                }
            });

            context.cms = {
                type,
                locale,
                getLocale,
                READ: type === "read",
                PREVIEW: type === "preview",
                MANAGE: type === "manage",
                storageOperations,
                accessControl,
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
                    accessControl,
                }),
                ...createModelsCrud({
                    context,
                    getLocale,
                    getTenant,
                    getIdentity,
                    storageOperations,
                    accessControl,
                }),
                ...createContentEntryCrud({
                    context,
                    getIdentity,
                    getTenant,
                    getLocale,
                    storageOperations,
                    accessControl,
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
