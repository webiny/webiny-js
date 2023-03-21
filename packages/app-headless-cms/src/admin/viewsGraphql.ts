import gql from "graphql-tag";
import { CmsErrorResponse, CmsGroup, CmsModel } from "~/types";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_CONTENT_MODEL_FIELDS = `
    description
    modelId
    name
    savedOn
    plugin
    tags
    fields {
        id
        type
        fieldId
    }
    group {
        id
        name
    }
    createdBy {
        id
        displayName
        type
    }
`;

/**
 * ############################
 * List groups with models Query
 * * Fetches data needed for constructing content models list in the main menu.
 */
export interface ListMenuCmsGroupsQueryResponse {
    listContentModelGroups: {
        data: CmsGroup[];
        error?: CmsErrorResponse;
    };
}

export const LIST_MENU_CONTENT_GROUPS_MODELS = gql`
    query CmsListMenuContentGroupsModels {
        listContentModelGroups {
            data {
                id
                name
                icon
                plugin
                contentModels {
                    name
                    modelId
                    plugin
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ############################
 * List Query
 */
export interface ListCmsModelsQueryResponse {
    listContentModels: {
        data: CmsModel[];
        error?: CmsErrorResponse;
    };
}

export const LIST_CONTENT_MODELS = gql`
    query CmsListContentModels {
        listContentModels {
            data {
                ${BASE_CONTENT_MODEL_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ############################
 * Create Mutation
 */
export interface CreateCmsModelMutationResponse {
    createContentModel: {
        data: CmsModel;
        error?: CmsErrorResponse;
    };
}

export interface CreateCmsModelMutationVariables {
    // @ts-refactor write the types.
    data: Record<string, any>;
}

export const CREATE_CONTENT_MODEL = gql`
    mutation CmsCreateContentModel($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data {
                ${BASE_CONTENT_MODEL_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ############################
 * Create From Mutation
 */
export interface CreateCmsModelFromMutationResponse {
    createContentModelFrom: {
        data: CmsModel;
        error?: CmsErrorResponse;
    };
}

export interface CreateCmsModelFromMutationVariables {
    modelId: string;
    data: CmsModel;
}

export const CREATE_CONTENT_MODEL_FROM = gql`
    mutation CmsCreateContentModelFrom($modelId: ID!, $data: CmsContentModelCreateFromInput!) {
        createContentModelFrom(modelId: $modelId, data: $data) {
            data {
                ${BASE_CONTENT_MODEL_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ############################
 * Delete Mutation
 */
export interface DeleteCmsModelMutationResponse {
    deleteContentModel: {
        data: boolean;
        error?: CmsErrorResponse;
    };
}

export interface DeleteCmsModelMutationVariables {
    modelId: string;
}

export const DELETE_CONTENT_MODEL = gql`
    mutation CmsDeleteContentModel($modelId: ID!) {
        deleteContentModel(modelId: $modelId) {
            data
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;
