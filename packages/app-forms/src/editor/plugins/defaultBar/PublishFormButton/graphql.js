// @flow
import gql from "graphql-tag";

export const publishRevision = gql`
    mutation FormsPublishRevision($id: ID!) {
        forms {
            publishRevision(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
