import gql from "graphql-tag";
import type { CmsErrorResponse, CmsModel } from "~/types.js";

const ERROR_FIELDS = `
    message
    code
    data
`;
export const FIELDS_FIELDS = `
    id
    fieldId
    storageId
    type
    label
    tags
    placeholderText
    helpText
    predefinedValues {
        enabled
        values {
            label
            value
            selected
        }
    }
    multipleValues
    renderer {
        name
        settings
    }
    validation {
        name
        settings
        message
    }
    listValidation {
        name
        settings
        message
    }
    settings
`;

export const MODEL_FIELDS = `
    name
    group {
        id
        name
    }
    icon
    description
    modelId
    singularApiName
    pluralApiName
    savedOn
    createdBy {
        id
        displayName
    }
    titleFieldId
    descriptionFieldId
    imageFieldId
    lockedFields
    layout
    tags
    fields {
        ${FIELDS_FIELDS}
    }
    plugin
    isBeingDeleted
    settings {
        workflows {
            id
            name
            steps {
                id
                title
                color
                description
                teams {
                    id
                }
                notifications {
                    id
                }
            }
        }
    }
`;
/**
 * ############################
 * Get Query
 */
export interface GetCmsModelQueryResponse {
    getContentModel: {
        data?: CmsModel;
        error?: CmsErrorResponse;
    };
}
export interface GetCmsModelQueryVariables {
    modelId: string;
}
export const GET_CONTENT_MODEL = gql`
    query CmsGetContentModel($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data {
                ${MODEL_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ############################
 * Update Mutation
 */
export interface UpdateCmsModelMutationResponse {
    updateContentModel: {
        data: CmsModel | null;
        error: CmsErrorResponse | null;
    };
}
export interface UpdateCmsModelMutationVariables {
    modelId: string;
    // TODO @ts-refactor write the types.
    data: Partial<CmsModel>;
}
export const UPDATE_CONTENT_MODEL = gql`
    mutation CmsUpdateContentModel($modelId: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(modelId: $modelId, data: $data) {
            data {
                ${MODEL_FIELDS}
            }
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;
