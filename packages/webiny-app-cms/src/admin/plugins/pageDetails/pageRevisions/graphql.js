import gql from "graphql-tag";

export const createRevisionFrom = gql`
    mutation CreateRevisionFrom($revisionId: ID!) {
        cms {
            revision: createRevisionFrom(revisionId: $revisionId) {
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