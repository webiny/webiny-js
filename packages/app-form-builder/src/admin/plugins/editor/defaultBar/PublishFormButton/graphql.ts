import gql from "graphql-tag";

export const publishRevision = gql`
    mutation FormsPublishRevision($revision: ID!) {
        formBuilder {
            publishRevision(revision: $revision) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
