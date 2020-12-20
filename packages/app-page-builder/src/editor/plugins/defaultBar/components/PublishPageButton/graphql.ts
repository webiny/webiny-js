import gql from "graphql-tag";

export const PUBLISH_PAGE = gql`
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                    path
                    status
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
