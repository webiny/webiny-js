import gql from "graphql-tag";

export const createRevisionFrom = gql`
    mutation CreateRevisionFrom($revisionId: ID!, $name: String!) {
        cms {
            revision: createRevisionFrom(revisionId: $revisionId, name: $name) {
                data {
                    id
                    page {
                        id
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const publishRevision = gql`
    mutation PublishRevision($id: ID!) {
        cms {
            publishRevision(id: $id) {
                data {
                    id
                    title
                    slug
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const deleteRevision = gql`
    mutation DeleteRevision($id: ID!) {
        cms {
            deleteRevision(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const activeRevisionFragment = gql`
    fragment activeRevisionFragment on Page {
        activeRevision {
            id
            title
            slug
            createdBy {
                firstName
            }
            updatedOn
            updatedBy {
                firstName
            }
        }
    }
`;
