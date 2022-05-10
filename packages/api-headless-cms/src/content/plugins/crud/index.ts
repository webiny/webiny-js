import { ContextPlugin } from "@webiny/handler";
import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import { createModelGroupsCrud } from "~/content/plugins/crud/contentModelGroup.crud";
import { createModelsCrud } from "~/content/plugins/crud/contentModel.crud";
import { createContentEntryCrud } from "~/content/plugins/crud/contentEntry.crud";
import { createSystemCrud } from "~/plugins/crud/system.crud";
import { createSettingsCrud } from "~/plugins/crud/settings.crud";

const debug = process.env.DEBUG === "true";

export interface CreateContentCrudsParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createContentCruds = (params: CreateContentCrudsParams) => {
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
                    `Missing initial "cms" on the context. Make sure that you set it up before creating Content CRUDs.`
                );
            return;
        }

        const getLocale = () => {
            return context.cms.getLocale();
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
