// @flow
import gql from "graphql-tag";

export const updateFileBySrc = gql`
    mutation UpdateFile($src: String!, $data: FileInput!) {
        files {
            updateFileBySrc(src: $src, data: $data) {
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
