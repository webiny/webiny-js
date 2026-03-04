import gql from "graphql-tag";

export interface IGetPreSignedPostPayloadResponse {
    fileManager: {
        getPreSignedPostPayload: {
            data?: {
                data: {
                    url: string;
                    fields: Record<string, string>;
                };
                file: {
                    id: string;
                    type: string;
                    name: string;
                    size: number;
                    key: string;
                };
            };
            error?: {
                message: string;
            };
        };
    };
}

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
