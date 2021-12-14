// import { CREATE_CONTENT_MODEL_GROUP } from "@webiny/app-headless-cms/admin/views/contentModelGroups/graphql";
// import { LIST_CONTENT_MODEL_GROUPS } from "@webiny/app-headless-cms/admin/views/contentModelGroups/graphql";
// import {
//     CREATE_CONTENT_MODEL,
//     LIST_CONTENT_MODELS
// } from "@webiny/app-headless-cms/admin/viewsGraphql";
import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_MODEL_FIELDS = `
    description
    modelId
    name
    savedOn
    plugin
    fields {
        id
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

const FIELDS_FIELDS = `
    id
    fieldId
    type
    label
    placeholderText
    helpText
    predefinedValues {
        enabled
        values {
            label
            value
        }
    }
    multipleValues
    renderer {
        name
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

const MODEL_FIELDS = `
    name
    group {
        id
        name
    }
    description
    modelId
    savedOn
    titleFieldId
    lockedFields
    layout
    fields {
        ${FIELDS_FIELDS}
    }
`;

const CONTENT_GROUP_FIELDS = `
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

export const createListModelsQuery = () => {
    return gql`
        query CmsListContentModels {
            listContentModels {
                data {
                    ${BASE_MODEL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    `;
};

export const createListGroupsQuery = () => {
    return gql`
        query CmsListContentModelGroups {
            listContentModelGroups {
                data {
                    ${CONTENT_GROUP_FIELDS}
                    contentModels {
                        modelId
                        name
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    `;
};

export const createInsertModelMutation = () => {
    return gql`
        mutation CmsCreateContentModel($data: CmsContentModelCreateInput!) {
            createContentModel(data: $data) {
                data {
                    ${BASE_MODEL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    `;
};

export const createUpdateModelMutation = () => {
    return gql`
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
};

export const createGetModelQuery = () => {
    return gql`
        query CmsGetContentModel($modelId: ID!) {
            getContentModel(modelId: $modelId) {
                data {
                    ${MODEL_FIELDS}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    `;
};

export const createInsertGroupMutation = () => {
    return gql`
        mutation CmsCreateContentModelGroup($data: CmsContentModelGroupInput!){
            contentModelGroup(data: $data) {
                data {
                    ${CONTENT_GROUP_FIELDS}
                    contentModels {
                        modelId
                        name
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    `;
};
