export const PB_PAGE_DATA_FIELD = /* GraphQL */ `
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
        locked
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

export const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data ${PB_PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        pageBuilder {
            unpublishPage(id: $id) {
                data ${PB_PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
