/**
 * Contains all of the GraphQL queries and mutations that we might need while writing our tests.
 * If needed, feel free to add more.
 */

export const GET_TARGET = /* GraphQL */ `
    query GetTarget($id: ID!) {
        targets {
            getTarget(id: $id) {
                id
                title
                description
            }
        }
    }
`;

export const CREATE_TARGET = /* GraphQL */ `
    mutation CreateTarget($data: TargetCreateInput!) {
        targets {
            createTarget(data: $data) {
                id
                title
                description
            }
        }
    }
`;

export const UPDATE_TARGET = /* GraphQL*/ `
    mutation UpdateTarget($id: ID!, $data: TargetUpdateInput!) {
        targets {
            updateTarget(id: $id, data: $data) {
                id
                title
                description
            }
        }
    }
`;

export const DELETE_TARGET = /* GraphQL */ `
    mutation DeleteTarget($id: ID!) {
        targets {
            deleteTarget(id: $id) {
                id
                title
                description
            }
        }
    }
`;

export const LIST_TARGETS = /* GraphQL */ `
    query ListTargets($sort: TargetsListSort, $limit: Int, $after: String) {
        targets {
            listTargets(sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    title
                    description
                }
                meta {
                    limit
                    cursor
                }
            }
        }
    }
`;
