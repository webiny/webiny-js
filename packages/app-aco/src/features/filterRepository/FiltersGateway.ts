import { FiltersGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { FilterDTO } from "~/components/AdvancedSearch/domain/index.js";
import type {
    CreateFilterPayload,
    CreateFilterResponse,
    DeleteFilterResponse,
    GetFilterResponse,
    ListFiltersResponse,
    UpdateFilterPayload,
    UpdateFilterResponse
} from "~/components/AdvancedSearch/gateways/filters.types.js";

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
        operation
        groups {
            operation
            filters {
                field
                condition
                value
            }
        }
        createdOn
    }
`;

const LIST_FILTERS = /* GraphQL */ `
    query ListFilters($namespace: String!, $limit: Int!) {
        aco {
            listFilters(where: { namespace: $namespace }, limit: $limit) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const GET_FILTER = /* GraphQL */ `
    query GetFilters($id: ID!) {
        aco {
            getFilter(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const CREATE_FILTER = /* GraphQL */ `
    mutation CreateFilter($data: FilterCreateInput!) {
        aco {
            createFilter(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const UPDATE_FILTER = /* GraphQL */ `
    mutation UpdateFilter($id: ID!, $data: FilterUpdateInput!) {
        aco {
            updateFilter(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const DELETE_FILTER = /* GraphQL */ `
    mutation DeleteFilter($id: ID!) {
        aco {
            deleteFilter(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

class FiltersGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list(namespace: string): Promise<FilterDTO[]> {
        const response = await this.client.execute<ListFiltersResponse>({
            query: LIST_FILTERS,
            variables: { namespace, limit: 10000 }
        });

        const { data, error } = response.aco.listFilters;

        if (!data) {
            throw new Error(error?.message || "Could not fetch filters.");
        }

        return data;
    }

    async get(id: string): Promise<FilterDTO> {
        const response = await this.client.execute<GetFilterResponse>({
            query: GET_FILTER,
            variables: { id }
        });

        const { data, error } = response.aco.getFilter;

        if (!data) {
            throw new Error(error?.message || `Could not fetch filter with id: ${id}`);
        }

        return data;
    }

    async create(filter: CreateFilterPayload): Promise<FilterDTO> {
        const response = await this.client.execute<CreateFilterResponse>({
            query: CREATE_FILTER,
            variables: { data: filter }
        });

        const { data, error } = response.aco.createFilter;

        if (!data) {
            throw new Error(error?.message || "Could not create filter.");
        }

        return data;
    }

    async update(filter: UpdateFilterPayload): Promise<FilterDTO> {
        const { id, name, description, operation, groups } = filter;

        if (!id) {
            throw new Error("Error while updating filter, missing id.");
        }

        const response = await this.client.execute<UpdateFilterResponse>({
            query: UPDATE_FILTER,
            variables: {
                id,
                data: { name, description, operation, groups }
            }
        });

        const { data, error } = response.aco.updateFilter;

        if (!data) {
            throw new Error(error?.message || "Could not update filter.");
        }

        return data;
    }

    async delete(id: string): Promise<boolean> {
        const response = await this.client.execute<DeleteFilterResponse>({
            query: DELETE_FILTER,
            variables: { id }
        });

        const { data, error } = response.aco.deleteFilter;

        if (!data) {
            throw new Error(error?.message || "Could not delete filter.");
        }

        return true;
    }
}

export const FiltersGateway = GatewayAbstraction.createImplementation({
    implementation: FiltersGatewayImpl,
    dependencies: [MainGraphQLClient]
});
