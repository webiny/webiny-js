const DATA_FIELD = /* GraphQL */ `
    {
        id
        name
        description
        namespace
        operation
        groups {
            operation
            filters {
                field
                condition
                value
            }
        }
        createdBy {
            id
            displayName
            type
        }
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
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

export const LIST_FILTERS = /* GraphQL */ `
    query ListFilters($where: FiltersListWhereInput!) {
        aco {
            listFilters(where: $where) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FILTER = /* GraphQL */ `
    query GetFilter($id: ID!) {
        aco {
            getFilter(id: $id ) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
