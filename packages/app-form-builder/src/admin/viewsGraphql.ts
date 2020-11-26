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

export const LIST_FORMS = gql`
    query FormsListForms($sort: ListFormsSortInput, $limit: Int, $search: String, $after: String, $before: String) {
        formBuilder {
            listForms(sort: $sort, limit: $limit, search: $search, after: $after, before: $before) {
                data {  
                    ${BASE_FORM_FIELDS}
                }
                meta {
                    cursors {
                        next
                        previous
                    }
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
            }
        }
    }
`;

export const CREATE_FORM = gql`
    mutation FormsCreateForm($name: String!) {
        formBuilder {
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
        formBuilder {
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
        $search: String
        $where: JSON
        $limit: Int
        $after: String
        $before: String
    ) {
        formBuilder {
            listFormSubmissions(
                sort: $sort
                search: $search
                where: $where
                limit: $limit
                after: $after
                before: $before
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
                                label
                                options {
                                    label
                                    value
                                }
                            }
                        }
                    }
                }
                meta {
                    cursors {
                        next
                        previous
                    }
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
            }
        }
    }
`;

export const EXPORT_FORM_SUBMISSIONS = gql`
    mutation FormsExportFormSubmissions($ids: [ID], $parent: ID!, $form: ID) {
        formBuilder {
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
        formBuilder {
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
        formBuilder {
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
        formBuilder {
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
        formBuilder {
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
        formBuilder {
            deleteForm(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
