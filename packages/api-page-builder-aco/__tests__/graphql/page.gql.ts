export const LIST_PAGES_DATA_FIELDS = /* GraphQL */ `
    {
        id
        pid
        status
        title
        version
        savedOn
        category {
            name
            slug
        }
        createdBy {
            id
            displayName
        }
    }
`;

export const DATA_FIELD = /* GraphQL */ `
    {
        id
        pid
        editor
        category {
            slug
        }
        version
        title
        path
        url
        content
        savedOn
        status
        locked
        publishedOn
        revisions {
            id
            status
            locked
            version
        }
        settings {
            general {
                snippet
                tags
                layout
                image {
                    id
                    src
                }
            }
            social {
                meta {
                    property
                    content
                }
                title
                description
                image {
                    id
                    src
                }
            }
            seo {
                title
                description
                meta {
                    name
                    content
                }
            }
        }
        createdFrom
        createdOn
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

export const GET_PAGE = /* GraphQL */ `
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGES = /* GraphQL */ `
    query PbListPages(
        $where: PbListPagesWhereInput
        $sort: [PbListPagesSort!]
        $search: PbListPagesSearchInput
        $limit: Int
        $after: String
    ) {
        pageBuilder {
            listPages(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data ${LIST_PAGES_DATA_FIELDS}
                error ${ERROR_FIELD}
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
            }
        }
    }
`;

export const CREATE_PAGE = /* GraphQL */ `
    mutation CreatePage($from: ID, $category: String, $meta: JSON) {
        pageBuilder {
            createPage(from: $from, category: $category, meta: $meta) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        pageBuilder {
            unpublishPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data {
                    page ${DATA_FIELD}
                    latestPage ${DATA_FIELD}
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
