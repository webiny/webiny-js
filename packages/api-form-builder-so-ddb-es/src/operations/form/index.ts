import { FormBuilderFormStorageOperations } from "@webiny/api-form-builder/types";

export const createFormStorageOperations = (): FormBuilderFormStorageOperations => {
    const createForm = () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const createFormFrom = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const updateForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const getForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listForms = () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listFormRevisions = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteFormRevision = async () => {
        throw new Error(
            "api-form-builder-so-ddb-esdoes not implement the Form Builder storage operations."
        );
    };

    const publishForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const unpublishForm = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    return {
        createForm,
        createFormFrom,
        updateForm,
        listForms,
        listFormRevisions,
        getForm,
        deleteForm,
        deleteFormRevision,
        publishForm,
        unpublishForm
    };
};
