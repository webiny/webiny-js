import { FormBuilderStorageOperations, FormBuilderContext } from "~/types";
import { FormsPermissions } from "./plugins/crud/permissions/FormsPermissions";
import {
    createFormBuilderContext,
    createFormBuilderGraphQL
} from "./cmsFormBuilderStorage/createFormBuilderContext";

export interface CreateFormBuilderParams {
    storageOperations: FormBuilderStorageOperations;
    formsPermissions: FormsPermissions;
    context: FormBuilderContext;
}

export const createFormBuilder = (storageOperations: {
    storageOperations: FormBuilderStorageOperations;
}) => {
    return [createFormBuilderContext(storageOperations), createFormBuilderGraphQL()];
};
