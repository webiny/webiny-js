import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_CONTENT_MODEL_FIELDS = `  
    id
    title
    savedOn
    createdBy {
        firstName
        lastName
    }
`;

// Fetches data needed for constructing content models list in the main menu.
export const LIST_MENU_CONTENT_GROUPS_MODELS = gql`
    query HeadlessCmsListMenuContentGroupsModels {
        cmsManage {
            listContentModelGroups(sort: { name: 1 }, page: 1, perPage: 100) {
                data {
                    id
                    name
                    icon
                    contentModels {
                        title
                        id
                    }
                }
            }
        }
    }
`;

export const LIST_CONTENT_MODELS = gql`
    query HeadlessCmsListContentModels($sort: JSON, $page: Int, $perPage: Int) {
        cmsManage {
            listContentModels(sort: $sort, page: $page, perPage: $perPage) {
                data {  
                    ${BASE_CONTENT_MODEL_FIELDS}
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

export const CREATE_CONTENT_MODEL = gql`
    mutation CreateContentModel($data: CmsContentModelInput!) {
        cmsManage {
            createContentModel(data: $data) {
                data {
                    id
                    title
                    description
                    modelId
                }
                error {
                    message
                    data
                }
            }
        }
    }
`;

export const GET_CONTENT_MODEL = gql`
    query FormsGetForm($id: ID!) {
        forms {
            form: getForm(id: $id) {
                data {
                    ${BASE_CONTENT_MODEL_FIELDS}
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

export const LIST_CONTENT_MODEL_SUBMISSIONS = gql`
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

export const EXPORT_CONTENT_MODEL_SUBMISSIONS = gql`
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

export const DELETE_CONTENT_MODEL = gql`
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
