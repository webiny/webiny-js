import gql from "graphql-tag";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = /* GraphQL */ `
    {
        id
        pid
        title
        path
        version
        locked
        status
        category {
            url
            name
            slug
        }
        revisions {
            id
            title
            status
            locked
            version
            savedOn
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
        createdBy {
            id
        }
        content
        savedOn
    }
`;

export const CREATE_PAGE_FROM = gql`
    mutation CreatePageFrom($from: ID) {
        pageBuilder {
            createPage(from: $from) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE = gql`
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
