import { ApolloClient } from "apollo-client";
import gql from "graphql-tag";

import {
    CreateFilterResponse,
    CreateFilterVariables,
    DeleteFilterResponse,
    DeleteFilterVariables,
    ListFiltersQueryVariables,
    ListFiltersResponse,
    UpdateFilterResponse,
    UpdateFilterVariables
} from "~/types";
import { BaseGateway, QueryObjectRaw } from "~/components/AdvancedSearch/QueryObject";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = /* GraphQL */ `
    {
        id
        name
        description
        modelId
        operation
        groups
        createdOn
    }
`;

export const CREATE_FILTER = gql`
    mutation CreateFilter($data: FilterCreateInput!) {
        aco {
            createFilter(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FILTERS = gql`
    query ListFilters($modelId: String!, $limit: Int!) {
        aco {
            listFilters(where: { modelId: $modelId }, limit: $limit) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FILTER = gql`
    mutation UpdateFilter($id: ID!, $data: FilterUpdateInput!) {
        aco {
            updateFilter(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FILTER = gql`
    mutation DeleteFilter($id: ID!) {
        aco {
            deleteFilter(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export class FiltersGraphQLGateway implements BaseGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async list(modelId: string) {
        const { data: response } = await this.client.query<
            ListFiltersResponse,
            ListFiltersQueryVariables
        >({
            query: LIST_FILTERS,
            variables: {
                modelId,
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

    async create(filter: Omit<QueryObjectRaw, "id" | "createdOn" | "createdBy" | "savedOn">) {
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

    async update(filter: Omit<QueryObjectRaw, "createdOn" | "createdBy" | "savedOn">) {
        const { id, name, description, operation, groups } = filter;

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
