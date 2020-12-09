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
