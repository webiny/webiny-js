import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { CmsParametersPlugin, CmsParametersPluginResponse } from "~/plugins/CmsParametersPlugin";
import { createSystemCrud } from "~/crud/system.crud";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/crud/contentModel.crud";
import { createContentEntryCrud } from "~/crud/contentEntry.crud";
import { StorageOperationsCmsModelPlugin } from "~/plugins";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter";
import { ModelsPermissions } from "~/utils/permissions/ModelsPermissions";
import { ModelGroupsPermissions } from "./utils/permissions/ModelGroupsPermissions";
import { EntriesPermissions } from "./utils/permissions/EntriesPermissions";
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

            const modelGroupsPermissions = new ModelGroupsPermissions({
                getIdentity: context.security.getIdentity,
                getPermissions: () => context.security.getPermissions("cms.contentModelGroup"),
                fullAccessPermissionName: "cms.*"
            });

            const modelsPermissions = new ModelsPermissions({
                getIdentity: context.security.getIdentity,
                getPermissions: () => context.security.getPermissions("cms.contentModel"),
                fullAccessPermissionName: "cms.*",
                modelGroupsPermissions
            });

            const entriesPermissions = new EntriesPermissions({
                getIdentity: context.security.getIdentity,
                getPermissions: () => context.security.getPermissions("cms.contentEntry"),
                fullAccessPermissionName: "cms.*"
            });

            context.cms = {
                type,
                locale,
                getLocale,
                READ: type === "read",
                PREVIEW: type === "preview",
                MANAGE: type === "manage",
                storageOperations,
                permissions: {
                    groups: modelGroupsPermissions,
                    models: modelsPermissions,
                    entries: entriesPermissions
                },
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
                    modelGroupsPermissions
                }),
                ...createModelsCrud({
                    context,
                    getLocale,
                    getTenant,
                    getIdentity,
                    storageOperations,
                    modelsPermissions
                }),
                ...createContentEntryCrud({
                    context,
                    getIdentity,
                    getTenant,
                    getLocale,
                    storageOperations,
                    entriesPermissions,
                    modelsPermissions
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
