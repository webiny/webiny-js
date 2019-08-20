// @flow
import gql from "graphql-tag";

export const deleteElement = gql`
    mutation deleteElement($id: ID!) {
        pageBuilder {
            deleteElement(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const updateElement = gql`
    mutation updateElement($id: ID!, $data: UpdateElementInput!) {
        pageBuilder {
            updateElement(id: $id, data: $data) {
                data {
                    id
                    name
                    type
                    category
                    content
                    preview {
                        src
                    }
                }
                error {
                    message
                }
            }
        }
    }
`;
