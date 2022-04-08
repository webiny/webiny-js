import gql from "graphql-tag";

const PAGE_ELEMENT_FIELDS = /*GraphQL*/ `
    {
        id
        name
        type
        category
        content
        preview
    }
`;

const ERROR_FIELDS = /*GraphQL*/ `
    {
        code
        message
    }
`;

export const DELETE_PAGE_ELEMENT = gql`
    mutation PbDeletePageElement($id: ID!) {
        pageBuilder {
            deletePageElement(id: $id) {
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_PAGE_ELEMENT = gql`
    mutation PbUpdatePageElement($id: ID!, $data: PbUpdatePageElementInput!) {
        pageBuilder {
            updatePageElement(id: $id, data: $data) {
                data ${PAGE_ELEMENT_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;
