import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { CmsParametersPlugin, CmsParametersPluginResponse } from "~/plugins/CmsParametersPlugin";
import { createSystemCrud } from "~/crud/system.crud";
import { createSettingsCrud } from "~/crud/settings.crud";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/crud/contentModel.crud";
import { createContentEntryCrud } from "~/crud/contentEntry.crud";

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
    return new ContextPlugin<CmsContext>(async context => {
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

        if (storageOperations.beforeInit) {
            await storageOperations.beforeInit(context);
        }

        context.cms = {
            type,
            locale,
            getLocale,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage",
            storageOperations,
            ...createSystemCrud({
                context,
                getTenant,
                getLocale,
                getIdentity,
                storageOperations
            }),
            ...createSettingsCrud({
                context,
                getTenant,
                getLocale,
                storageOperations
            }),
            ...createModelGroupsCrud({
                context,
                getTenant,
                getLocale,
                getIdentity,
                storageOperations
            }),
            ...createModelsCrud({
                context,
                getLocale,
                getTenant,
                getIdentity,
                storageOperations
            }),
            ...createContentEntryCrud({
                context,
                getIdentity,
                getTenant,
                storageOperations
            })
        };

        if (!storageOperations.init) {
            return;
        }
        await storageOperations.init(context);
    });
};
