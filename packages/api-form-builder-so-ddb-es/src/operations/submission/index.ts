import {
    FbSubmission,
    FormBuilderStorageOperationsCreateSubmissionParams,
    FormBuilderStorageOperationsDeleteSubmissionParams,
    FormBuilderStorageOperationsGetSubmissionParams,
    FormBuilderStorageOperationsListSubmissionsParams,
    FormBuilderStorageOperationsUpdateSubmissionParams,
    FormBuilderSubmissionStorageOperations
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { Tenant } from "@webiny/api-tenancy/types";
import { Client } from "@elastic/elasticsearch";

export interface Params {
    entity: Entity<any>;
    table: Table;
    elasticsearch: Client;
}

export const createSubmissionStorageOperations = (
    params: Params
): FormBuilderSubmissionStorageOperations => {
    const createPartitionKey = () => {
        return "";
    };
    const createSortKey = () => {
        return "";
    };

    const createSubmission = async (
        params: FormBuilderStorageOperationsCreateSubmissionParams
    ): Promise<FbSubmission> => {};

    const deleteSubmission = async (
        params: FormBuilderStorageOperationsDeleteSubmissionParams
    ): Promise<FbSubmission> => {};

    const updateSubmission = async (
        params: FormBuilderStorageOperationsUpdateSubmissionParams
    ): Promise<FbSubmission> => {};

    const listSubmissions = async (
        params: FormBuilderStorageOperationsListSubmissionsParams
    ): Promise<FbSubmission[]> => {};

    const getSubmission = async (
        params: FormBuilderStorageOperationsGetSubmissionParams
    ): Promise<FbSubmission> => {};

    return {
        createSubmission,
        deleteSubmission,
        updateSubmission,
        listSubmissions,
        getSubmission,
        createPartitionKey,
        createSortKey
    };
};
