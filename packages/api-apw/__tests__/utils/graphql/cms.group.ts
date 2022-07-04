const DATA_FIELD = /* GraphQL*/ `
    {
        id
        name
        slug
        description
        icon
        createdOn
        savedOn
        createdBy {
            id
            displayName
            type
        }
    }
`;
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_CONTENT_MODEL_GROUP_MUTATION = /* GraphQL */ `
    mutation CreateContentModelGroupMutation($data: CmsContentModelGroupInput!) {
        createContentModelGroup(data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
