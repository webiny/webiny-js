import gql from "graphql-tag";

export const PUBLISH_REVISION = gql`
    mutation CmsPublishContentModel($id: ID!) {
        publishContentModel(id: $id) {
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
