// We use these fields in every query / mutation below.
const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export const GET_TARGET = /* GraphQL */ `
    query GetTarget(
        $id: ID!
    ) {
        targets {
            getTarget(id: $id) {
                data {
                    id
                    title
                    description
                    isNice
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

// A basic create "Target" mutation.
export const CREATE_TARGET = /* GraphQL */ `
    mutation CreateTarget($data: TargetCreateInput!) {
        targets {
            createTarget(data: $data) {
                data {
                    id
                    title
                    description
                    isNice
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_TARGET = /* GraphQL*/ `
    mutation UpdateTarget($id: ID!, $data: TargetUpdateInput!) {
        targets {
            updateTarget(id: $id, data: $data) {
                data {
                    id
                    title
                    description
                    isNice
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

// A basic delete "Target" mutation.
export const DELETE_TARGET = /* GraphQL */ `
    mutation DeleteTarget($id: ID!) {
        targets {
            deleteTarget(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

// A basic list "Targets" query.
export const LIST_TARGETS = /* GraphQL */ `
    query ListTargets(
        $where: TargetListWhereInput
        $sort: [TargetListSort!]
        $limit: Int
        $after: String
    ) {
        targets {
            listTargets(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    title
                    description
                    isNice
                }
                error ${ERROR_FIELDS}

            }
        }
    }
`;
