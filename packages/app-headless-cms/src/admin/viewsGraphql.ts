import gql from "graphql-tag";
import type { CmsErrorResponse, CmsGroup, CmsModel } from "~/types.js";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_CONTENT_MODEL_FIELDS = `
    description
    modelId
    singularApiName
    pluralApiName
    name
    icon
    savedOn
    plugin
    tags
    fields {
        id
        type
        fieldId
    }
    group
    createdBy {
        id
        displayName
        type
    }
    isBeingDeleted
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
                slug
                name
                icon
                plugin
                contentModels {
                    name
                    modelId
                    singularApiName
                    pluralApiName
                    plugin
                    icon
                    createdBy {
                        id
                        displayName
                        type
                    }
                    isBeingDeleted
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

export interface ListCmsModelsQueryVariables {
    includeBeingDeleted?: boolean;
    includePlugins?: boolean;
}

const createListContentModelsQuery = (includeBeingDeleted: boolean) => {
    return gql`
        query CmsListContentModels {
            listContentModels(includeBeingDeleted: ${includeBeingDeleted ? "true" : "false"}) {
                data {
                    ${BASE_CONTENT_MODEL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    `;
};

export const LIST_CONTENT_MODELS = createListContentModelsQuery(true);

export const isModelBeingDeleted = (model: CmsModel): boolean => {
    return !model.isBeingDeleted;
};

export const isModelHidden = (model: Pick<CmsModel, "tags">) => {
    if (!model.tags?.length) {
        return false;
    }
    return model.tags.includes("$hidden:true") === false;
};

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

export const DELETE_CMS_MODEL_TASK_FIELDS = `
    id
    status
    deleted
    total
`;

export interface IDeleteCmsModelTask {
    id: string;
    status: string;
    deleted: number;
    total: number;
}

export interface IFullyDeleteCmsModelMutationVariables {
    modelId: string;
    confirmation: string;
}

export interface IFullyDeleteCmsModelMutationResponse {
    fullyDeleteModel: {
        data?: IDeleteCmsModelTask;
        error?: CmsErrorResponse;
    };
}

export const FULLY_DELETE_CONTENT_MODEL = gql`
    mutation CmsFullyDeleteContentModel($modelId: ID!, $confirmation: String!) {
        fullyDeleteModel(modelId: $modelId, confirmation: $confirmation) {
            data {
                ${DELETE_CMS_MODEL_TASK_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

export interface ICancelDeleteCmsModelMutationVariables {
    modelId: string;
}

export interface ICancelDeleteCmsModelMutationResponse {
    cancelFullyDeleteModel: {
        data?: IDeleteCmsModelTask;
        error?: CmsErrorResponse;
    };
}

export const CANCEL_DELETE_CONTENT_MODEL = gql`
    mutation CmsCancelDeleteContentModel($modelId: ID!) {
        cancelFullyDeleteModel(modelId: $modelId) {
            data {
                ${DELETE_CMS_MODEL_TASK_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;
