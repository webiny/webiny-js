const DATA_FIELD = /* GraphQL*/ `
    {
        id
        name
        description
        group {
            id
            name
        }
        createdOn
        changedOn
        createdBy
    }
`;
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const GET_CONTENT_MODEL_QUERY = /* GraphQL */ `
    query GetContentModelQuery($id: ID!) {
        getContentModel(id: $id) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const LIST_CONTENT_MODELS_QUERY = /* GraphQL */ `
    query ListContentModelQuery {
        listContentModels {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const CREATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation CreateContentModelMutation($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const UPDATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation UpdateContentModelMutation($id: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(id: $id, data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const DELETE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation DeleteContentModelMutation($id: ID!) {
        deleteContentModel(id: $id) {
            data
            error ${ERROR_FIELD}
        }
    }
`;
