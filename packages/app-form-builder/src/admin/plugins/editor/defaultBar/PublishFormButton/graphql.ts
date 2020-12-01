import gql from "graphql-tag";

export const publishRevision = gql`
    mutation FormsPublishRevision($id: ID!) {
        formBuilder {
            publishRevision(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
