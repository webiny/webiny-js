// @flow
import gql from "graphql-tag";

export const publishRevision = gql`
    mutation CmsPublishRevision($id: ID!) {
        cms {
            publishRevision(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
