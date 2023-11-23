import { FormBuilderSubmissionStorageOperations } from "@webiny/api-form-builder/types";

export const createSubmissionStorageOperations = (): FormBuilderSubmissionStorageOperations => {
    const createSubmission = () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const updateSubmission = () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const deleteSubmission = async () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    const listSubmissions = () => {
        throw new Error(
            "api-form-builder-so-ddb does not implement the Form Builder storage operations."
        );
    };

    return {
        createSubmission,
        deleteSubmission,
        updateSubmission,
        listSubmissions
    };
};
