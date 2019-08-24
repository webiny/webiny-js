// @flow
import gql from "graphql-tag";

export const setHomePage = gql`
    mutation SetHomePage($id: ID!) {
        pageBuilder {
            setHomePage(id: $id) {
                error {
                    message
                }
            }
        }
    }
`;
