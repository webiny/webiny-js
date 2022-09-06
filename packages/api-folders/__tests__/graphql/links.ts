const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        id
        linkId
        folderId
        ${extra}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_LINK = /* GraphQL */ `
    mutation CreateLink($data: LinkCreateInput!) {
        folders {
            createLink(data: $data) {
                data ${DATA_FIELD("id")}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_LINK = /* GraphQL */ `
    mutation UpdateLink($id: ID!, $data: LinkUpdateInput!) {
        folders {
            updateLink(id: $id, data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_LINK = /* GraphQL */ `
    mutation DeleteLink($id: ID!) {
        folders {
            deleteLink(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_LINKS = /* GraphQL */ `
    query ListLinks($where: LinksListWhereInput!) {
        folders {
            listLinks(where: $where) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_LINK = /* GraphQL */ `
    query GetLink($id: ID!) {
        folders {
            getLink(id: $id ) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
