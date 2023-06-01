import gql from "graphql-tag";

export const GET_PRE_SIGNED_POST_PAYLOAD = gql`
    query getPreSignedPostPayload($data: PreSignedPostPayloadInput!) {
        fileManager {
            getPreSignedPostPayload(data: $data) {
                data {
                    data
                    file {
                        id
                        type
                        name
                        size
                        key
                    }
                }
                error {
                    message
                }
            }
        }
    }
`;
