import gql from "graphql-tag";

export const PUBLISH_PAGE = gql`
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                    url
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
