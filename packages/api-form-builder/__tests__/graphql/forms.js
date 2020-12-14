export const FORM_DATA_FIELD = /* GraphQL */ `
    {
        id
        savedOn
        createdOn
        publishedOn
        version
        name
        layout
        settings {
            reCaptcha {
                settings {
                    enabled
                    siteKey
                    secretKey
                }
            }
        }
        revisions {
            id
            name
            version
        }
        triggers
        published
        locked
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
    }
`;

export const FORMS_DATA_FIELD = /* GraphQL */ `
    {
        id
        createdOn
        savedOn
        name
        slug
        published
        publishedOn
        version
        locked
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
    mutation UpdateRevision($id: ID!, $data: FbUpdateFormInput!) {
        formBuilder {
            updateRevision(id: $id, data: $data) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_REVISION = /* GraphQL */ `
    mutation publishRevision($id: ID!) {
        formBuilder {
            publishRevision(id: $id) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_REVISION = /* GraphQL */ `
    mutation UnpublishRevision($id: ID!) {
        formBuilder {
            unpublishRevision(id: $id) {
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
    mutation DeleteRevision($id: ID!) {
        formBuilder {
            deleteRevision(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const SAVE_FORM_VIEW = /* GraphQL */ `
    mutation SaveFormView($id: ID!) {
        formBuilder {
            saveFormView(id: $id) {
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FORM = /* GraphQL */ `
    query GetForm($id: ID!) {
        formBuilder {
            getForm(id: $id) {
                data ${FORM_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PUBLISHED_FORM = /* GraphQL */ `
    query GetPublishedForm($revision: ID, $parent: ID) {
        formBuilder {
            getPublishedForm(revision: $revision, parent: $parent) {
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
