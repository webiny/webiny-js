const REDIRECT_DATA_FIELD = /* GraphQL */ `
    {
        id
        redirectFrom
        redirectTo
        redirectType
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
        websiteBuilder {
            createRedirect(data: $data) {
                data ${REDIRECT_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_REDIRECT = /* GraphQL */ `
    mutation UpdateRedirect($id: ID!, $data: WbRedirectUpdateInput!) {
        websiteBuilder {
            updateRedirect(id: $id, data: $data) {
                data ${REDIRECT_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const MOVE_REDIRECT = /* GraphQL */ `
    mutation MoveRedirect($id: ID!, $folderId: ID!) {
        websiteBuilder {
            moveRedirect(id: $id, folderId: $folderId) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_REDIRECT = /* GraphQL */ `
    mutation DeleteRedirect($id: ID!) {
        websiteBuilder {
            deleteRedirect(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_REDIRECTS = /* GraphQL */ `
    query ListRedirects($limit: Int, $after: String, $where: WbRedirectsListWhereInput) {
        websiteBuilder {
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
