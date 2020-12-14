const DATA_FIELD = /* GraphQL*/ `
    {
        id
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
        cms {
            getContentModel(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_CONTENT_MODELS_QUERY = /* GraphQL */ `
    query ListContentModelQuery {
        cms {
            listContentModels {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation CreateContentModelMutation($data: CmsContentModelCreateInput!) {
        cms {
            createContentModel(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation UpdateContentModelMutation($data: CmsContentModelUpdateInput!) {
        cms {
            updateContentModel(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation DeleteContentModelMutation($id: ID!) {
        cms {
            deleteContentModel(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
