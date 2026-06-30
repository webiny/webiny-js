import type { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";

import type {
    CreateFilterPayload,
    CreateFilterResponse,
    DeleteFilterResponse,
    GetFilterResponse,
    GetFilterQueryVariables,
    CreateFilterVariables,
    UpdateFilterVariables,
    DeleteFilterVariables,
    ListFiltersResponse,
    ListFiltersQueryVariables,
    UpdateFilterPayload,
    UpdateFilterResponse
} from "./filters.types.js";
import type { FiltersGatewayInterface } from "./FiltersGatewayInterface.js";
import {
    CREATE_FILTER,
    DELETE_FILTER,
    GET_FILTER,
    LIST_FILTERS,
    UPDATE_FILTER
} from "./filters.gql.js";

export class FiltersGraphQLGateway implements FiltersGatewayInterface {
    private client: MainGraphQLClient.Interface;

    constructor(client: MainGraphQLClient.Interface) {
        this.client = client;
    }

    async list(namespace: string) {
        const response = await this.client.execute<ListFiltersResponse, ListFiltersQueryVariables>({
            query: LIST_FILTERS,
            variables: {
                namespace,
                limit: 10000
            }
        });

        if (!response) {
            throw new Error("Network error while listing filters.");
        }

        const { data, error } = response.aco.listFilters;

        if (!data) {
            throw new Error(error?.message || "Could not fetch filters.");
        }

        return data;
    }

    async get(id: string) {
        const response = await this.client.execute<GetFilterResponse, GetFilterQueryVariables>({
            query: GET_FILTER,
            variables: { id }
        });

        if (!response) {
            throw new Error("Network error while fetch filter.");
        }

        const { data, error } = response.aco.getFilter;

        if (!data) {
            throw new Error(error?.message || `Could not fetch filter with id: ${id}`);
        }

        return data;
    }

    async create(filter: CreateFilterPayload) {
        const response = await this.client.execute<CreateFilterResponse, CreateFilterVariables>({
            query: CREATE_FILTER,
            variables: {
                data: filter
            }
        });

        if (!response) {
            throw new Error("Network error while creating filter.");
        }

        const { data, error } = response.aco.createFilter;

        if (!data) {
            throw new Error(error?.message || "Could not create filter.");
        }

        return data;
    }

    async update(filter: UpdateFilterPayload) {
        const { id, name, description, operation, groups } = filter;

        if (!id) {
            throw new Error("Error while updating filter, missing id.");
        }

        const response = await this.client.execute<UpdateFilterResponse, UpdateFilterVariables>({
            query: UPDATE_FILTER,
            variables: {
                id,
                data: {
                    name,
                    description,
                    operation,
                    groups
                }
            }
        });

        if (!response) {
            throw new Error("Network error while updating filter.");
        }

        const { data, error } = response.aco.updateFilter;

        if (!data) {
            throw new Error(error?.message || "Could not update filter.");
        }

        return data;
    }

    async delete(id: string) {
        const response = await this.client.execute<DeleteFilterResponse, DeleteFilterVariables>({
            query: DELETE_FILTER,
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while deleting filter.");
        }

        const { data, error } = response.aco.deleteFilter;

        if (!data) {
            throw new Error(error?.message || "Could not delete filter.");
        }

        return true;
    }
}
