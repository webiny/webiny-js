import gql from "graphql-tag";

const I18N_FIELDS = `
    values {
        value
        locale
    }
`;
/*
list: true,
    label: i18nString({ context, validation: required }),
    type: string({ validation: required }),
    localization: boolean({ validation: required }),
    unique: boolean({ validation: required }),
    validation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: required }),
            message: i18nString({ context }),
            settings: object({ value: {} })
        })()
    }),
    settings: object({ value: {} })*/

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        name
        label {
            ${I18N_FIELDS}
        }
        placeholderText {
            ${I18N_FIELDS}
        }
        helpText {
            ${I18N_FIELDS}
        }  
        options {
            label {
                ${I18N_FIELDS}
            }
            value
        }
        validation {
            name
            settings
            message {
                ${I18N_FIELDS}
            }
        }
        settings
`;

export const GET_CONTENT_MODEL = gql`
    query GetContentModel($id: ID!) {
        cmsManage {
            getContentModel(id: $id) {
                data {
                    id
                    title
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    layout
                }
            }
        }
    }
`;

export const UPDATE_REVISION = gql`
    mutation UpdateForm($id: ID!, $data: UpdateFormInput!) {
        cmsManage {
            updateRevision(id: $id, data: $data) {
                data {
                    id
                    title
                    version
                    fields {
                        ${FIELDS_FIELDS}
                    }
                    layout
                    triggers
                }
            }
        }
    }
`;
