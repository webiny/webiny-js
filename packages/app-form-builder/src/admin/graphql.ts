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
    published
    status
    savedOn
    createdBy {
        id
        displayName
    }
`;

export const LIST_FORMS = gql`
    query FbListForms {
        formBuilder {
            listForms {
                data {  
                    ${BASE_FORM_FIELDS}
                }
                error {
                    code
                    message
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
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const GET_FORM = gql`
    query FbGetForm($revision: ID!) {
        formBuilder {
            form: getForm(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                    overallStats {
                        views
                        submissions
                        conversionRate
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const GET_FORM_REVISIONS = gql`
    query FbGetFormRevisions($id: ID!) {
        formBuilder {
            revisions: getFormRevisions(id: $id) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const LIST_FORM_SUBMISSIONS = gql`
    query FbListFormSubmissions(
        $form: ID!
        $sort: [FbSubmissionSort!]
        $limit: Int
        $after: String
    ) {
        formBuilder {
            listFormSubmissions(form: $form, sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    data
                    meta {
                        ip
                        submittedOn
                    }
                    form {
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
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const EXPORT_FORM_SUBMISSIONS = gql`
    mutation FormsExportFormSubmissions($form: ID!) {
        formBuilder {
            exportFormSubmissions(form: $form) {
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
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const PUBLISH_REVISION = gql`
    mutation FormsPublishRevision($revision: ID!) {
        formBuilder {
            publishRevision(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const UNPUBLISH_REVISION = gql`
    mutation FormsUnpublishRevision($revision: ID!) {
        formBuilder {
            unpublishRevision(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_REVISION = gql`
    mutation FormsDeleteRevision($revision: ID!) {
        formBuilder {
            deleteForm: deleteRevision(revision: $revision) {
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
