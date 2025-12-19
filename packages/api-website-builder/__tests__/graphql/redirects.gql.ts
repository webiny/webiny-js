const REDIRECT_DATA_FIELD = /* GraphQL */ `
    {
        id
        entryId
        version
        source
        target
        type
        status
        locked
        savedOn
        createdOn
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_REDIRECT = /* GraphQL */ `
    mutation CreateRedirect($data: WbRedirectCreateInput!) {
        wb {
            createRedirect(data: $data) {
                data ${REDIRECT_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_REDIRECT = /* GraphQL */ `
    mutation UpdateRedirect($id: ID!, $data: WbRedirectUpdateInput!) {
        wb {
            updateRedirect(id: $id, data: $data) {
                data ${REDIRECT_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const MOVE_REDIRECT = /* GraphQL */ `
    mutation MoveRedirect($id: ID!, $folderId: ID!) {
        wb {
            moveRedirect(id: $id, folderId: $folderId) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_REDIRECT = /* GraphQL */ `
    mutation DeleteRedirect($id: ID!) {
        wb {
            deleteRedirect(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_REDIRECTS = /* GraphQL */ `
    query ListRedirects($limit: Int, $after: String, $where: WbRedirectsListWhereInput) {
        wb {
            listRedirects(limit: $limit, after: $after, where: $where) {
                data ${REDIRECT_DATA_FIELD}
                error ${ERROR_FIELD}
                meta {
                    cursor
                    totalCount
                    hasMoreItems
                }
            }
        }
    }
`;
