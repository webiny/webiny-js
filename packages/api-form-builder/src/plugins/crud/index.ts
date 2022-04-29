import { FormBuilderContext, FormBuilderStorageOperations } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { createSystemCrud } from "~/plugins/crud/system.crud";
import { createSettingsCrud } from "~/plugins/crud/settings.crud";
import { createFormsCrud } from "~/plugins/crud/forms.crud";
import { createSubmissionsCrud } from "~/plugins/crud/submissions.crud";
import WebinyError from "@webiny/error";

export interface CreateFormBuilderCrudParams {
    storageOperations: FormBuilderStorageOperations;
}

export default (params: CreateFormBuilderCrudParams) => {
    const { storageOperations } = params;

    return new ContextPlugin<FormBuilderContext>(async context => {
        const getLocale = () => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError(
                    "Missing locale on context.i18n locale in API Form Builder.",
                    "LOCALE_ERROR"
                );
            }
            return locale;
        };

        const getIdentity = () => {
            return context.security.getIdentity();
        };

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        if (storageOperations.beforeInit) {
            try {
                await storageOperations.beforeInit(context);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not run before init in Form Builder storage operations.",
                    ex.code || "STORAGE_OPERATIONS_BEFORE_INIT_ERROR",
                    {
                        ...ex
                    }
                );
            }
        }

        context.formBuilder = {
            storageOperations,
            ...createSystemCrud({
                getIdentity,
                getTenant,
                getLocale,
                context
            }),
            ...createSettingsCrud({
                getTenant,
                getLocale,
                context
            }),
            ...createFormsCrud({
                getTenant,
                getLocale,
                context
            }),
            ...createSubmissionsCrud({
                context
            })
        };

        if (!storageOperations.init) {
            return;
        }
        try {
            await storageOperations.init(context);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not run init in Form Builder storage operations.",
                ex.code || "STORAGE_OPERATIONS_INIT_ERROR",
                {
                    ...ex
                }
            );
        }
    });
};
