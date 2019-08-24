// @flow
import gql from "graphql-tag";

export const publishRevision = gql`
    mutation PbPublishRevision($id: ID!) {
        pageBuilder {
            publishRevision(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
