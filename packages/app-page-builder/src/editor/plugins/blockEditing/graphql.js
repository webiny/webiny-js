// @flow
import gql from "graphql-tag";

export const DELETE_ELEMENT = gql`
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

export const UPDATE_ELEMENT = gql`
    mutation updateElement($id: ID!, $data: PbUpdateElementInput!) {
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
