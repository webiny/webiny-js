import { ContextPlugin } from "@webiny/handler";
import { CmsContext, HeadlessCmsStorageOperations } from "~/types";
import { createModelGroupsCrud } from "./contentModelGroup.crud";
import { createModelsCrud } from "./contentModel.crud";
import { createContentEntryCrud } from "./contentEntry.crud";
import { createSystemCrud } from "./system.crud";
import { createSettingsCrud } from "./settings.crud";

export interface CrudParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export const createCrud = (params: CrudParams) => {
    const { storageOperations } = params;
    return new ContextPlugin<CmsContext>(async context => {
        if (context.http?.request?.method === "OPTIONS") {
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
