import { setupFormBuilderContext } from "./plugins/crud";
import triggerHandlers from "./plugins/triggers";
import validators from "./plugins/validators";
import formBuilderPrerenderingPlugins from "~/plugins/prerenderingHooks";
import { FormBuilderStorageOperations, FormBuilderContext } from "~/types";
import { FormsPermissions } from "./plugins/crud/permissions/FormsPermissions";

export interface CreateFormBuilderParams {
    storageOperations: FormBuilderStorageOperations;
    formsPermissions: FormsPermissions;
    context: FormBuilderContext;
}

export const createFormBuilder = (params: CreateFormBuilderParams) => {
    return [
        setupFormBuilderContext(params),
        triggerHandlers,
        validators,
        formBuilderPrerenderingPlugins()
    ];
};
