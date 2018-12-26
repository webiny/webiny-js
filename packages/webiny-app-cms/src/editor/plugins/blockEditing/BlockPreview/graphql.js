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
