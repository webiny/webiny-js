import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import { createModelGroupsCrud } from "~/content/plugins/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/content/plugins/crud/contentModel.crud";
import { createContentEntryCrud } from "~/content/plugins/crud/contentEntry.crud";
import WebinyError from "@webiny/error";
import { createSystemCrud } from "~/plugins/crud/system.crud";
import { createSettingsCrud } from "~/plugins/crud/settings.crud";

export interface Params {
    storageOperations: HeadlessCmsStorageOperations;
}
export const createContentCruds = (params: Params) => {
    const { storageOperations } = params;
    return new ContextPlugin<CmsContext>(async context => {
        /**
         * This should never happen in the actual project.
         * It is to make sure that we load setup context before the CRUD init in our internal code.
         */
        if (!context.cms) {
            throw new WebinyError(
                `Missing initial "cms" on the context. Make sure that you set it up before creating Content CRUDs.`,
                "MALFORMED_CONTEXT_ERROR"
            );
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

        context.cms = {
            ...context.cms,
            system: createSystemCrud({
                context,
                getTenant,
                getLocale,
                getIdentity,
                storageOperations
            }),
            settings: createSettingsCrud({
                context,
                getTenant,
                getLocale,
                storageOperations
            }),
            groups: createModelGroupsCrud({
                context,
                getTenant,
                getLocale,
                getIdentity,
                storageOperations
            }),
            models: createModelsCrud({
                context,
                getLocale,
                getTenant,
                getIdentity,
                storageOperations
            }),
            entries: createContentEntryCrud({
                context,
                getLocale,
                getTenant,
                getIdentity,
                storageOperations
            })
        };
    });
};
