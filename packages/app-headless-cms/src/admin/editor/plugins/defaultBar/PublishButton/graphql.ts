import gql from "graphql-tag";

export const PUBLISH_REVISION = gql`
    mutation CmsPublishRevision($id: ID!) {
        publishRevision(id: $id) {
            data {
                id
                status
                version
                published
            }
            error {
                code
                message
            }
        }
    }
`;
