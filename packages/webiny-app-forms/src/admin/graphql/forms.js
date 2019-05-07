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
    url
    version
    parent
    published
    locked
    savedOn
`;

export const createForm = gql`
    mutation CmsCreateForm($category: ID!) {
        cms {
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
    query CmsListForms($sort: JSON, $form: Int, $perForm: Int, $search: String) {
        cms {
            forms: listForms(sort: $sort, form: $form, perForm: $perForm, search: $search) {
                data {
                    ${sharedFields}
                    category {
                        id
                        name
                    }
                    createdBy {
                        firstName
                        lastName
                    }
                }
                meta {
                    totalCount
                    to
                    from
                    nextForm
                    previousForm
                }
            }
        }
    }
`;

export const getForm = () => gql`
    query CmsGetForm($id: ID!) {
        cms {
            form: getForm(id: $id) {
                data {
                    ${sharedFields}
                    snippet
                    content
                    settings {
                        _empty
                        ${getPlugins("cms-editor-form-settings")
                            .map((pl: CmsFormSettingsPluginType) => pl.fields)
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
    mutation CmsCreateRevisionFrom($revision: ID!) {
        cms {
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
    mutation CmsPublishRevision($id: ID!) {
        cms {
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
    mutation CmsDeleteRevision($id: ID!) {
        cms {
            deleteRevision(id: $id) {
                data
                ${error}
            }
        }
    }
`;

export const deleteForm = gql`
    mutation DeleteForm($id: ID!) {
        cms {
            deleteForm(id: $id) {
                data
                ${error}
            }
        }
    }
`;

const elementFields = /*GraphQL*/ `
    id
    name
    type
    category
    content
    preview {
        src
        meta
    }
`;

export const listElements = gql`
    query CmsListElements {
        cms {
            elements: listElements(perForm: 1000) {
                data {
                    ${elementFields}
                }
            }
        }
    }
`;

export const createElement = gql`
    mutation CmsCreateElement($data: ElementInput!) {
        cms {
            element: createElement(data: $data) {
                data {
                    ${elementFields}
                }
                ${error}
            }
        }
    }
`;

export const updateElement = gql`
    mutation CmsUpdateElement($id: ID!, $data: UpdateElementInput!) {
        cms {
            element: updateElement(id: $id, data: $data) {
                data {
                    ${elementFields}
                }
                ${error}
            }
        }
    }
`;
