import { FormBuilderStorageOperations, FormBuilderContext } from "~/types";
import { createSystemCrud } from "~/plugins/crud/system.crud";
import { createSettingsCrud } from "~/plugins/crud/settings.crud";
import { createFormsCrud } from "~/plugins/crud/forms.crud";
import { createSubmissionsCrud } from "~/plugins/crud/submissions.crud";
import WebinyError from "@webiny/error";
import { FormsPermissions } from "./permissions/FormsPermissions";
import { SettingsPermissions } from "~/plugins/crud/permissions/SettingsPermissions";

export interface CreateFormBuilderCrudParams {
    storageOperations: FormBuilderStorageOperations;
    context: FormBuilderContext;
}

export const setupFormBuilderContext = async (params: CreateFormBuilderCrudParams) => {
    const { storageOperations, context } = params;

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

    try {
        if (storageOperations.beforeInit) {
            await storageOperations.beforeInit(context);
        }

        if (storageOperations.forms.beforeInit) {
            await storageOperations.forms.beforeInit(context);
        }

        if (storageOperations.submissions.beforeInit) {
            await storageOperations.submissions.beforeInit(context);
        }
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not run before init in Form Builder storage operations.",
            ex.code || "STORAGE_OPERATIONS_BEFORE_INIT_ERROR",
            {
                ...ex
            }
        );
    }

    const basePermissionsArgs = {
        getIdentity,
        fullAccessPermissionName: "fb.*"
    };

    const formsPermissions = new FormsPermissions({
        ...basePermissionsArgs,
        getPermissions: () => context.security.getPermissions("fb.form")
    });

    const settingsPermissions = new SettingsPermissions({
        ...basePermissionsArgs,
        getPermissions: () => context.security.getPermissions("fb.settings")
    });

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
            settingsPermissions,
            context
        }),
        ...createFormsCrud({
            getTenant,
            getLocale,
            formsPermissions,
            context
        }),
        ...createSubmissionsCrud({
            context,
            formsPermissions
        })
    };

    try {
        if (storageOperations.init) {
            await storageOperations.init(context);
        }

        if (storageOperations.forms.init) {
            await storageOperations.forms.init(context);
        }

        if (storageOperations.submissions.init) {
            await storageOperations.submissions.init(context);
        }
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not run init in Form Builder storage operations.",
            ex.code || "STORAGE_OPERATIONS_INIT_ERROR",
            {
                ...ex
            }
        );
    }
};
