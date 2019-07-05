// @flow
import gql from "graphql-tag";

export const setHomePage = gql`
    mutation SetHomePage($id: ID!) {
        cms {
            pageBuilder {
                setHomePage(id: $id) {
                    error {
                        message
                    }
                }
            }
        }
    }
`;
