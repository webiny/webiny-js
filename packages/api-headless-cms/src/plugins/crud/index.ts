import { createSettingsCrud } from "./settings.crud";
import { createSystemCrud } from "./system.crud";
import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { createModelGroupsCrud } from "~/content/plugins/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/content/plugins/crud/contentModel.crud";
import { createContentEntryCrud } from "~/content/plugins/crud/contentEntry.crud";
import { I18NLocale } from "@webiny/api-i18n/types";

const debug = process.env.DEBUG === "true";

export interface CreateAdminCrudsParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createAdminCruds = (params: CreateAdminCrudsParams) => {
    const { storageOperations } = params;
    return new ContextPlugin<CmsContext>(async context => {
        if (context.http?.request?.method === "OPTIONS") {
            return;
        }

        /**
         * This should never happen in the actual project.
         * It is to make sure that we load setup context before the CRUD init in our internal code.
         */
        if (!context.cms) {
            debug &&
                console.log(
                    `Missing initial "cms" on the context. Make sure that you set it up before creating Admin CRUDs.`
                );
            return;
        }
        const getLocale = () => {
            // Casting into I18NLocale because we're sure that, at this point, we will have a locale.
            return context.i18n.getContentLocale() as I18NLocale;
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
            ...context.cms,
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
                getTenant,
                getLocale,
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
