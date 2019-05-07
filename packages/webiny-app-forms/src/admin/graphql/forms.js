// @flow
import gql from "graphql-tag";
import { getPlugins } from "webiny-plugins";

const error = `
error {
    code
    message
}`;

const sharedFields = `
    id
    title
    version
    parent
    published
    locked
    savedOn
`;

export const createForm = gql`
    mutation FormsCreateForm($category: ID!) {
        forms {
            form: createForm(data: { category: $category }) {
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
            forms: listForms(sort: $sort, page: $page, perPage: $perPage, search: $search) {
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

export const getForm = () => gql`
    query FormsGetForm($id: ID!) {
        forms {
            form: getForm(id: $id) {
                data {
                    ${sharedFields}
                    snippet
                    content
                    settings {
                        _empty
                        ${getPlugins("forms-editor-form-settings")
                            .map((pl: FormsFormSettingsPluginType) => pl.fields)
                            .join("\n")}
                    }
                    category {
                        id
                        name
                        url
                    }
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