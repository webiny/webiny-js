// @flow
import gql from "graphql-tag";

const error = `
error {
    code
    message
    data
}`;

const sharedFields = `
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

export const createForm = gql`
    mutation FormsCreateForm($name: String!) {
        forms {
            form: createForm(data: { name: $name }) {
                data {
                    id
                }
                ${error}
            }
        }
    }
`;

export const listForms = gql`
    query FormsListForms($sort: JSON, $page: Int, $perPage: Int, $search: String) {
        forms {
            listForms(sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    ${sharedFields}
                    createdBy {
                        firstName
                        lastName
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
                    fields
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
                    ${sharedFields}
                    revisions {
                        ${sharedFields}
                    }
                }
                ${error}
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
                ${error}
            }
        }
    }
`;

export const publishRevision = gql`
    mutation FormsPublishRevision($id: ID!) {
        forms {
            publishRevision(id: $id) {
                data {
                    ${sharedFields}
                }
                ${error}
            }
        }
    }
`;

export const deleteRevision = gql`
    mutation FormsDeleteRevision($id: ID!) {
        forms {
            deleteRevision(id: $id) {
                data
                ${error}
            }
        }
    }
`;

export const deleteForm = gql`
    mutation DeleteForm($id: ID!) {
        forms {
            deleteForm(id: $id) {
                data
                ${error}
            }
        }
    }
`;
