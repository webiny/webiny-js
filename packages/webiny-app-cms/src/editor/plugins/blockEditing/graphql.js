// @flow
import gql from "graphql-tag";

export const deleteElement = gql`
    mutation deleteElement($id: ID!) {
        cms {
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
        cms {
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
