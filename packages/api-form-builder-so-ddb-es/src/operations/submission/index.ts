import { FormBuilderSubmissionStorageOperations } from "@webiny/api-form-builder/types";

export const createSubmissionStorageOperations = (): FormBuilderSubmissionStorageOperations => {
    const createSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const updateSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listSubmissions = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    return {
        createSubmission,
        deleteSubmission,
        updateSubmission,
        listSubmissions
    };
};
