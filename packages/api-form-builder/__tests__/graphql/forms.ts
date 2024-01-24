export const FORM_DATA_FIELD = /* GraphQL */ `
    {
        id
        formId
        version
        savedOn
        createdOn
        publishedOn
        version
        name
        steps {
            title
            layout
        }
        fields {
            fieldId
            type
        }
        settings {
            reCaptcha {
                settings {
                    enabled
                    siteKey
                    secretKey
                }
            }
        }
        triggers
        status
        stats {
            views
            submissions
        }
        overallStats {
            views
            submissions
            conversionRate
        }
        createdBy {
            id
            displayName
            type
        }
    }
`;

export const FORMS_DATA_FIELD = /* GraphQL */ `
    {
        id
        createdOn
        savedOn
        name
        slug
        publishedOn
        version
        status
        createdBy {
            id
            displayName
            type
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_FROM = /* GraphQL */ `
    mutation CreateForm($data: FbCreateFormInput!) {
        formBuilder {
            createForm(data: $data) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

// Create a new revision from an existing revision
export const CREATE_REVISION_FROM = /* GraphQL */ `
    mutation CreateRevisionFrom($revision: ID!) {
        formBuilder {
            createRevisionFrom(revision: $revision) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_REVISION = /* GraphQL */ `
    mutation UpdateRevision($revision: ID!, $data: FbUpdateFormInput!) {
        formBuilder {
            updateRevision(revision: $revision, data: $data) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_REVISION = /* GraphQL */ `
    mutation publishRevision($revision: ID!) {
        formBuilder {
            publishRevision(revision: $revision) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_REVISION = /* GraphQL */ `
    mutation UnpublishRevision($revision: ID!) {
        formBuilder {
            unpublishRevision(revision: $revision) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FORM = /* GraphQL */ `
    mutation DeleteForm($id: ID!) {
        formBuilder {
            deleteForm(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_REVISION = /* GraphQL */ `
    mutation DeleteRevision($revision: ID!) {
        formBuilder {
            deleteRevision(revision: $revision) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const SAVE_FORM_VIEW = /* GraphQL */ `
    mutation SaveFormView($revision: ID!) {
        formBuilder {
            saveFormView(revision: $revision) {
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FORM = /* GraphQL */ `
    query GetForm($revision: ID!) {
        formBuilder {
            getForm(revision: $revision) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FORM_REVISIONS = /* GraphQL */ `
    query GetFormRevisions($id: ID!) {
        formBuilder {
            getFormRevisions(id: $id) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PUBLISHED_FORM = /* GraphQL */ `
    query GetPublishedForm($formId: ID) {
        formBuilder {
            getPublishedForm(formId: $formId) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FORMS = /* GraphQL */ `
    query ListForms {
        formBuilder {
            listForms {
                data ${FORMS_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
