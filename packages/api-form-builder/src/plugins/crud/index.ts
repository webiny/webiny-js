import { FormBuilderStorageOperations, FormBuilderContext } from "~/types";
import { createSystemCrud } from "~/plugins/crud/system.crud";
import { createSettingsCrud } from "~/plugins/crud/settings.crud";
import { createFormsCrud } from "~/plugins/crud/forms.crud";
import { createFormStatsCrud } from "~/plugins/crud/formStats.crud";
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
        ...createFormStatsCrud({
            getTenant,
            getLocale
        }),
        ...createSubmissionsCrud({
            context,
            formsPermissions
        })
    };
};
