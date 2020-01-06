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
        validation {
            name
            settings
            message {
                value
            }
        }
        settings
`;

export const LIST_FORMS = gql`
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

export const CREATE_FORM = gql`
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

export const GET_FORM = gql`
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

export const LIST_FORM_SUBMISSIONS = gql`
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
                            layout
                            fields {
                                _id
                                fieldId
                                type
                                label {
                                    value
                                }
                                options {
                                    label {
                                        value
                                    }
                                    value
                                }
                            }
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

export const EXPORT_FORM_SUBMISSIONS = gql`
    mutation FormsExportFormSubmissions($ids: [ID], $parent: ID, $form: ID) {
        forms {
            exportFormSubmissions(ids: $ids, parent: $parent, form: $form) {
                data {
                    src
                }
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_REVISION_FROM = gql`
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

export const PUBLISH_REVISION = gql`
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

export const UNPUBLISH_REVISION = gql`
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

export const DELETE_REVISION = gql`
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

export const DELETE_FORM = gql`
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
