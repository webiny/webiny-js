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

export const CREATE_FILTER = /* GraphQL */ `
    mutation CreateFilter($data: FilterCreateInput!) {
        aco {
            createFilter(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FILTERS = /* GraphQL */ `
    query ListFilters($namespace: String!, $limit: Int!) {
        aco {
            listFilters(where: { namespace: $namespace }, limit: $limit) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FILTER = /* GraphQL */ `
    query GetFilters($id: ID!) {
        aco {
            getFilter(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FILTER = /* GraphQL */ `
    mutation UpdateFilter($id: ID!, $data: FilterUpdateInput!) {
        aco {
            updateFilter(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FILTER = /* GraphQL */ `
    mutation DeleteFilter($id: ID!) {
        aco {
            deleteFilter(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
