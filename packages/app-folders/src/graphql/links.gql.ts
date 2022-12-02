import gql from "graphql-tag";

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
        linkId
        folderId
    }
`;

export const CREATE_LINK = gql`
    mutation CreateLink($data: LinkCreateInput!) {
        folders {
            createLink(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_LINKS = gql`
    query ListLinks ($folderId: ID!) {
        folders {
            listLinks(where: { folderId: $folderId }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_LINK = gql`
    query GetLink ($id: ID!) {
        folders {
            getLink(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_LINK = gql`
    mutation UpdateLink($id: ID!, $data: LinkUpdateInput!) {
        folders {
            updateLink(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_LINK = gql`
    mutation DeleteLink($id: ID!) {
        folders {
            deleteLink(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
