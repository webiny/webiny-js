import { CmsGroupCreateInput } from "~/types";

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

export interface ContentModelGroupsMutationVariables {
    data: CmsGroupCreateInput;
}
export const CREATE_CONTENT_MODEL_GROUP_MUTATION = /* GraphQL */ `
    mutation CreateContentModelGroupMutation($data: CmsContentModelGroupInput!) {
        createContentModelGroup(data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
export const GET_CONTENT_MODEL_GROUP_QUERY = /* GraphQL */ `
    query GetContentModelGroupQuery($id: ID!) {
        getContentModelGroup(id: $id) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
export const UPDATE_CONTENT_MODEL_GROUP_MUTATION = /* GraphQL */ `
    mutation UpdateContentModelGroupMutation($id: ID!, $data: CmsContentModelGroupInput!) {
        updateContentModelGroup(id: $id, data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
export const DELETE_CONTENT_MODEL_GROUP_MUTATION = /* GraphQL */ `
    mutation DeleteContentModelGroupMutation($id: ID!) {
        deleteContentModelGroup(id: $id) {
            data
            error ${ERROR_FIELD}
        }
    }
`;
export const LIST_CONTENT_MODEL_GROUP_QUERY = /* GraphQL */ `
    query ListContentModelGroupsQuery {
        listContentModelGroups {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
