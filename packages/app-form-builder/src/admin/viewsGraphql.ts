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
`;

export const LIST_FORMS = gql`
    query FormsListForms($sort: JSON, $limit: Int, $search: String, $after: String, $before: String) {
        forms {
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
        $search: String
        $where: JSON
        $limit: Int
        $after: String
        $before: String
    ) {
        forms {
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
