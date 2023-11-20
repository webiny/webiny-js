import { ApolloClient } from "apollo-client";

import {
    CreateFilterPayload,
    CreateFilterResponse,
    CreateFilterVariables,
    DeleteFilterResponse,
    DeleteFilterVariables,
    GetFilterQueryVariables,
    GetFilterResponse,
    ListFiltersQueryVariables,
    ListFiltersResponse,
    UpdateFilterPayload,
    UpdateFilterResponse,
    UpdateFilterVariables
} from "./filters.types";
import { FiltersGatewayInterface } from "./FiltersGatewayInterface";
import {
    CREATE_FILTER,
    DELETE_FILTER,
    GET_FILTER,
    LIST_FILTERS,
    UPDATE_FILTER
} from "./filters.gql";

export class FiltersGraphQLGateway implements FiltersGatewayInterface {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async list(namespace: string) {
        const { data: response } = await this.client.query<
            ListFiltersResponse,
            ListFiltersQueryVariables
        >({
            query: LIST_FILTERS,
            variables: {
                namespace,
                limit: 10000
            },
            fetchPolicy: "network-only"
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
        const { data: response } = await this.client.query<
            GetFilterResponse,
            GetFilterQueryVariables
        >({
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
        const { data: response } = await this.client.mutate<
            CreateFilterResponse,
            CreateFilterVariables
        >({
            mutation: CREATE_FILTER,
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

        const { data: response } = await this.client.mutate<
            UpdateFilterResponse,
            UpdateFilterVariables
        >({
            mutation: UPDATE_FILTER,
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
        const { data: response } = await this.client.mutate<
            DeleteFilterResponse,
            DeleteFilterVariables
        >({
            mutation: DELETE_FILTER,
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
