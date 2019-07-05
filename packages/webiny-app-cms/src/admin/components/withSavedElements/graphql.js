// @flow
import gql from "graphql-tag";

export const deleteElement = gql`
    mutation DeleteElement($id: ID!) {
        cms {
            pageBuilder {
                deleteElement(id: $id) {
                    data
                    error {
                        code
                        message
                    }
                }
            }
        }
    }
`;

export const updateElement = gql`
    mutation updateElement($id: ID!, $data: UpdateElementInput!) {
        cms {
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
    }
`;
