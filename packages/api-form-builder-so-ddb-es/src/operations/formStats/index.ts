import { FormBuilderFormStatsStorageOperations } from "@webiny/api-form-builder/types";

export const createFormStatsStorageOperations = (): FormBuilderFormStatsStorageOperations => {
    const getFormStats = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const listFormStats = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const createFormStats = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const updateFormStats = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    const deleteFormStats = async () => {
        throw new Error(
            "api-form-builder-so-ddb-es does not implement the Form Builder storage operations."
        );
    };

    return {
        getFormStats,
        listFormStats,
        createFormStats,
        updateFormStats,
        deleteFormStats
    };
};
