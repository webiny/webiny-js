import {
    FbForm,
    FormBuilderFormStorageOperations,
    FormBuilderStorageOperationsCreateFormParams,
    FormBuilderStorageOperationsDeleteFormParams,
    FormBuilderStorageOperationsGetFormParams,
    FormBuilderStorageOperationsListFormRevisionsParams,
    FormBuilderStorageOperationsListFormsParams,
    FormBuilderStorageOperationsListFormsResponse,
    FormBuilderStorageOperationsPublishFormParams,
    FormBuilderStorageOperationsUnpublishFormParams,
    FormBuilderStorageOperationsUpdateFormParams
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { Tenant } from "@webiny/api-tenancy/types";
import { Client } from "@elastic/elasticsearch";
import { QueryAllParams } from "@webiny/db-dynamodb/utils/query";

export interface Params {
    entity: Entity<any>;
    table: Table;
    tenant: Tenant;
    elasticsearch: Client;
}

export const createFormStorageOperations = (params: Params): FormBuilderFormStorageOperations => {
    const { entity, table, tenant } = params;

    const createPartitionKey = () => {
        return "";
    };

    const createForm = async (
        params: FormBuilderStorageOperationsCreateFormParams
    ): Promise<FbForm> => {};

    const updateForm = async (
        params: FormBuilderStorageOperationsUpdateFormParams
    ): Promise<FbForm> => {};

    const listForms = async (
        params: FormBuilderStorageOperationsListFormsParams
    ): Promise<FormBuilderStorageOperationsListFormsResponse> => {};

    const listFormRevisions = async (
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]> => {
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey(),
            options: {
                beginsWith: "REV#"
            }
        };
    };

    const getForm = async (
        params: FormBuilderStorageOperationsGetFormParams
    ): Promise<FbForm> => {};

    const deleteForm = async (
        params: FormBuilderStorageOperationsDeleteFormParams
    ): Promise<FbForm> => {};

    const publishForm = async (
        params: FormBuilderStorageOperationsPublishFormParams
    ): Promise<FbForm> => {};

    const unpublishForm = async (
        params: FormBuilderStorageOperationsUnpublishFormParams
    ): Promise<FbForm> => {};

    return {
        createForm,
        listForms,
        listFormRevisions,
        getForm,
        deleteForm,
        publishForm,
        unpublishForm,
        updateForm
    };
};
