// @flow
import gql from "graphql-tag";

const error = `
    code
    message
    data
`;

const i18nFields = `
    values {
        value
        locale
    }
`;

export const fieldsFields = `
        id
        fieldId
        type
        label {
            ${i18nFields}
        }
        placeholderText {
            ${i18nFields}
        }
        helpText {
            ${i18nFields}
        }
        defaultValue
        validation
        settings
`;

const baseFields = `
    id
    name
    version
    parent
    published
    savedOn
    createdBy {
        firstName
        lastName
    }
`;

export const listFormSubmissions = gql`
    query FormsListFormSubmissions($sort: JSON, $page: Int, $perPage: Int, $search: String) {
        forms {
            listFormSubmissions(sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    id
                    data
                    meta {
                        ip
                        submittedOn
                    }
                }
                meta {
                    totalCount
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const getForm = gql`
    query FormsGetForm($id: ID!) {
        forms {
            form: getForm(id: $id) {
                data {
                    fields {
                        ${fieldsFields}
                    }
                    layout
                    stats {
                        views
                        submissions
                        conversionRate
                    }
                    settings {
                        layout {
                            renderer
                        }
                    }
                    ${baseFields}
                    revisions {
                        ${baseFields}
                    }
                }
                error {
                    ${error}
                }
            }
        }
    }
`;
