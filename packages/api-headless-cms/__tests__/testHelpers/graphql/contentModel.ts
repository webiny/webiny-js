import { CmsModel, CmsModelField, Icon } from "~/types";

const DATA_FIELD = /* GraphQL*/ `
    {
        modelId
        singularApiName
        pluralApiName
        name
        description
        group {
            id
            name
            slug
        }
        icon
        layout
        titleFieldId
        descriptionFieldId
        imageFieldId
        fields {
            id
            label
            helpText
            placeholderText
            storageId
            fieldId
            type
            multipleValues
            predefinedValues {
                enabled
                values {
                    label
                    value
                }
            }
            renderer {
                name
            }
            validation {
                name
                message
                settings
            }
            listValidation {
                name
                message
                settings
            }
            settings
        }
        plugin
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

export const GET_CONTENT_MODEL_QUERY = /* GraphQL */ `
    query GetContentModelQuery($modelId: ID!) {
        getContentModel(modelId: $modelId) {
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

export interface CreateContentModelMutationVariables {
    data: {
        name: string;
        modelId?: string;
        group: string | { id: string; name: string };
        singularApiName: string;
        pluralApiName: string;
        description?: string;
        fields?: Omit<CmsModelField, "storageId">[];
        layout?: string[][];
        titleFieldId?: string;
        defaultFields?: boolean;
        icon?: Icon;
    };
}
export interface CreateContentModelFromMutationVariables {
    modelId: string;
    data: {
        name: string;
        modelId?: string;
        group: string | { id: string; name: string };
        singularApiName: string;
        pluralApiName: string;
        description?: string;
        fields?: Omit<CmsModelField, "storageId">[];
        layout?: string[][];
        titleFieldId?: string;
        locale?: `${Lowercase<string>}-${Uppercase<string>}`;
        icon?: Icon;
    };
}

export interface CreateContentModelMutationResponse {
    errors?: any[];
    data: {
        createContentModel: {
            data: CmsModel;
            error: {
                message: string;
                code: any;
                data: any;
            };
        };
    };
}

export const CREATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation CreateContentModelMutation($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const CREATE_CONTENT_MODEL_FROM_MUTATION = /* GraphQL */ `
    mutation CreateContentModelFromMutation($modelId: ID!, $data: CmsContentModelCreateFromInput!) {
        createContentModelFrom(modelId: $modelId, data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const UPDATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation UpdateContentModelMutation($modelId: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(modelId: $modelId, data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const DELETE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation DeleteContentModelMutation($modelId: ID!) {
        deleteContentModel(modelId: $modelId) {
            data
            error ${ERROR_FIELD}
        }
    }
`;
