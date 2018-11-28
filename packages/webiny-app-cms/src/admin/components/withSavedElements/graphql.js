// @flow
import gql from "graphql-tag";

export const deleteElement = gql`
    mutation DeleteElement($id: ID!) {
        cms {
            deleteElement(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
