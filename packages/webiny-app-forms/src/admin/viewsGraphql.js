// @flow
import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_FORM_FIELDS = `  
    id
    name
    version
    parent
    published
    status
    savedOn
    createdBy {
        firstName
        lastName
    }
`;

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        label {
            value
        }
        placeholderText {
            value
        }
        helpText {
            value
        }
        options {
            label {
                value
            }
            value
        }
        validation
        settings
`;

const FIELDS_LAYOUT_FIELDS = `
    layout
    fields {
        ${FIELDS_FIELDS}
    }
`;

export const listForms = gql`
    query FormsListForms($sort: JSON, $page: Int, $perPage: Int, $search: String) {
        forms {
            listForms(sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {  
                    ${BASE_FORM_FIELDS}
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

export const createForm = gql`
    mutation FormsCreateForm($name: String!) {
        forms {
            form: createForm(data: { name: $name }) {
                data {
                    id
                }
                error {
                    ${ERROR_FIELDS}
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
                    ${BASE_FORM_FIELDS}
                    overallStats {
                        views
                        submissions
                        conversionRate
                    }
                    revisions {
                        id
                        savedOn
                        parent
                        name
                        version
                        status
                        stats {
                            views
                            submissions
                            conversionRate
                        }
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const listFormSubmissions = gql`
    query FormsListFormSubmissions(
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: String
        $where: JSON
    ) {
        forms {
            listFormSubmissions(
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
                where: $where
            ) {
                data {
                    id
                    data
                    meta {
                        ip
                        submittedOn
                    }
                    form {
                        revision {
                            id
                            name
                            version
                            ${FIELDS_LAYOUT_FIELDS}
                        }
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

export const createRevisionFrom = gql`
    mutation FormsCreateRevisionFrom($revision: ID!) {
        forms {
            revision: createRevisionFrom(revision: $revision) {
                data {
                    id
                }
                error {
                    ${ERROR_FIELDS}
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
                    id
                    status
                    published
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const unpublishRevision = gql`
    mutation FormsUnpublishRevision($id: ID!) {
        forms {
            unpublishRevision(id: $id) {
                data {
                    id
                    status
                    published
                }
                error {
                    ${ERROR_FIELDS}
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
                    ${ERROR_FIELDS}
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
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
