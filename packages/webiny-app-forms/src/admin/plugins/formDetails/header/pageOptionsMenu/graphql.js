// @flow
import gql from "graphql-tag";

export const setHomePage = gql`
    mutation SetHomePage($id: ID!) {
        cms {
            setHomePage(id: $id) {
                error {
                    message
                }
            }
        }
    }
`;
