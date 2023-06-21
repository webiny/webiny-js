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

export const GET_MODEL_QUERY = /* GraphQL */ `
    query GetContentModelQuery($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
