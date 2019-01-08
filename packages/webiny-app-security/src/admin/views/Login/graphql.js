// @flow
import gql from "graphql-tag";

export const loginMutation = gql`
    mutation Login($username: String!, $password: String!, $remember: Boolean) {
        security {
            loginUser(username: $username, password: $password, remember: $remember) {
                data {
                    token
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
