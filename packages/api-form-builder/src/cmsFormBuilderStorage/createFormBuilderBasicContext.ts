import { FormBuilderStorageOperations, FormBuilderContext } from "~/types";
import { FormsPermissions } from "../plugins/crud/permissions/FormsPermissions";
import { setupFormBuilderContext } from "../plugins/crud";
import triggerHandlers from "../plugins/triggers";
import validators from "../plugins/validators";
import formBuilderPrerenderingPlugins from "~/plugins/prerenderingHooks";

export interface CreateFormBuilderParams {
    storageOperations: FormBuilderStorageOperations;
    formsPermissions: FormsPermissions;
    context: FormBuilderContext;
}

export const createFormBuilderBasicContext = (params: CreateFormBuilderParams) => {
    return [
        setupFormBuilderContext(params),
        triggerHandlers,
        validators,
        formBuilderPrerenderingPlugins()
    ];
};
