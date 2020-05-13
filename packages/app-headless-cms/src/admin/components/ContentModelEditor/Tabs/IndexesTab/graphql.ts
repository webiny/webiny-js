import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

export const CREATE_INDEX = gql`
    mutation CreateContentModel($data: CmsContentModelInput!) {
        createContentModel(data: $data) {
            data {
                id
                name
                description
                modelId
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_INDEX = gql`
    mutation HeadlessCmsDeleteContentModel($id: ID!) {
        deleteContentModel(id: $id) {
            data
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;
