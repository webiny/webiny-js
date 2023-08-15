import gql from "graphql-tag";
import { CmsErrorResponse, CmsGroup as BaseCmsGroup, CmsModel } from "~/types";

const ERROR_FIELS = `
    message
    code
    data
`;
const fields = `
    id
    name
    slug
    description
    icon
    createdOn
    plugin
    createdBy {
        id
        displayName
        type
    }
`;
export type CmsGroup = Omit<BaseCmsGroup, "contentModels">;
export interface CmsGroupWithModels extends CmsGroup {
    contentModels: Pick<CmsModel, "modelId" | "name">[];
}
/**
 * ############################
 * List groups with basic models info Query
 */
export interface ListCmsGroupsQueryResponse {
    listContentModelGroups: {
        data: CmsGroupWithModels[];
        error?: CmsErrorResponse;
    };
}
export const LIST_CONTENT_MODEL_GROUPS = gql`
    query CmsListContentModelGroups {
        listContentModelGroups {
            data {
                ${fields}
                contentModels {
                    modelId
                    name
                }
            }
            error {
                ${ERROR_FIELS}
            }
        }
    }
`;
/**
 * ############################
 * Get Group Query
 */
export interface GetCmsGroupQueryResponse {
    contentModelGroup: {
        data: CmsGroup;
        error?: CmsErrorResponse;
    };
}
export interface GetCmsGroupQueryVariables {
    id: string;
}
export const GET_CONTENT_MODEL_GROUP = gql`
    query CmsGetContentModelGroup($id: ID!) {
        contentModelGroup: getContentModelGroup(id: $id){
            data {
                ${fields}
            }
            error {
                ${ERROR_FIELS}
            }
        }
    }
`;

/**
 * ############################
 * Create Group Mutation
 */
export interface CreateCmsGroupMutationResponse {
    contentModelGroup: {
        data: CmsGroupWithModels;
        error?: CmsErrorResponse;
    };
}
export interface CreateCmsGroupMutationVariables {
    // @ts-refactor write the types.
    data: Record<string, any>;
}
export const CREATE_CONTENT_MODEL_GROUP = gql`
    mutation CmsCreateContentModelGroup($data: CmsContentModelGroupInput!){
        contentModelGroup: createContentModelGroup(data: $data) {
            data {
                ${fields}
                contentModels {
                    modelId
                    name
                }
            }
            error {
                ${ERROR_FIELS}
            }
        }
    }
`;
/**
 * ############################
 * Update Group Mutation
 */
export interface UpdateCmsGroupMutationResponse {
    contentModelGroup: {
        data: CmsGroup;
        error?: CmsErrorResponse;
    };
}
export interface UpdateCmsGroupMutationVariables {
    id: string;
    // @ts-refactor write the types.
    data: Record<string, any>;
}
export const UPDATE_CONTENT_MODEL_GROUP = gql`
    mutation CmsUpdateContentModelGroup($id: ID!, $data: CmsContentModelGroupInput!){
        contentModelGroup: updateContentModelGroup(id: $id, data: $data) {
            data {
                ${fields}
            }
            error {
                ${ERROR_FIELS}
            }
        }
    }
`;
/**
 * ############################
 * Delete Group Mutation
 */
export interface DeleteCmsGroupMutationResponse {
    contentModelGroup: {
        data: boolean;
        error?: CmsErrorResponse;
    };
}
export interface DeleteCmsGroupMutationVariables {
    id: string;
}
export const DELETE_CONTENT_MODEL_GROUP = gql`
    mutation CmsDeleteContentModelGroup($id: ID!) {
        deleteContentModelGroup(id: $id) {
            data
            error {
                ${ERROR_FIELS}
            }
        }
    }
`;
