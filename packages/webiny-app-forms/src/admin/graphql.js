// @flow
import gql from "graphql-tag";

const errorFields = `
    code
    message
    data
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

export const createForm = gql`
    mutation FormsCreateForm($name: String!) {
        forms {
            form: createForm(data: { name: $name }) {
                data {
                    id
                }
                error {
                    ${errorFields}
                }
            }
        }
    }
`;

export const listForms = gql`
    query FormsListForms($sort: JSON, $page: Int, $perPage: Int, $search: String) {
        forms {
            listForms(sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    ${baseFields}
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
                    layout
                    fields {
                        ${fieldsFields}
                    }
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
                    ${errorFields}
                }
            }
        }
    }
`;

export const createRevisionFrom = gql`
    mutation FormsCreateRevisionFrom($revision: ID!) {
        forms {
            revision: createRevisionFrom(revision: $revision) {
                data {
                    id
                }
                error {
                    ${errorFields}
                }
            }
        }
    }
`;

export const publishRevision = gql`
    mutation FormsPublishRevision($id: ID!) {
        forms {
            publishRevision(id: $id) {
                data {
                    ${baseFields}
                }
                error {
                    ${errorFields}
                }
            }
        }
    }
`;

export const deleteRevision = gql`
    mutation FormsDeleteRevision($id: ID!) {
        forms {
            deleteRevision(id: $id) {
                data
                error {
                    ${errorFields}
                }
            }
        }
    }
`;

export const deleteForm = gql`
    mutation DeleteForm($id: ID!) {
        forms {
            deleteForm(id: $id) {
                data
                error {
                    ${errorFields}
                }
            }
        }
    }
`;
