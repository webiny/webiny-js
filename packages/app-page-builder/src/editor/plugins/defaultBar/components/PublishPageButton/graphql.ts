import gql from "graphql-tag";

export const PUBLISH_REVISION = gql`
    mutation PbPublishRevision($id: ID!) {
        pageBuilder {
            publishRevision(id: $id) {
                data {
                    id
                    published
                    url
                    locked
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
