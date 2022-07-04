const DATA_FIELD = /* GraphQL*/ `
    {
        modelId
        name
        description
        group {
            id
            name
        }
        layout
        titleFieldId
        fields {
            id
            label
            helpText
            placeholderText
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

export const CREATE_CONTENT_MODEL_MUTATION = /* GraphQL */ `
    mutation CreateContentModelMutation($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
