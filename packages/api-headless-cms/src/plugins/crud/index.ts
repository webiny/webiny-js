import { createSettingsCrud } from "./settings.crud";
import { createSystemCrud } from "./system.crud";
import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { createModelGroupsCrud } from "~/content/plugins/crud/contentModelGroup.crud";

export interface Params {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createAdminCruds = (params: Params) => {
    const { storageOperations } = params;
    return new ContextPlugin<CmsContext>(async context => {
        /**
         * This should never happen in the actual project.
         * It is to make sure that we load setup context before the CRUD init in our internal code.
         */
        if (!context.cms) {
            console.log(
                `Missing initial "cms" on the context. Make sure that you set it up before creating Admin CRUDs.`
            );
            return;
        }
        const getLocale = () => {
            return context.i18n.getCurrentLocale();
        };

        const getIdentity = () => {
            return context.security.getIdentity();
        };

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        if (storageOperations.plugins && storageOperations.plugins.length > 0) {
            context.plugins.register(storageOperations.plugins);
        }

        context.cms.system = createSystemCrud({
            context,
            getTenant,
            getIdentity,
            storageOperations
        });
        context.cms.settings = createSettingsCrud({
            context,
            getTenant,
            getLocale,
            storageOperations
        });
        context.cms.groups = createModelGroupsCrud({
            context,
            getTenant,
            getLocale,
            getIdentity,
            storageOperations
        });

        if (!storageOperations.init) {
            return;
        }
        await storageOperations.init(context.cms);
    });
};
