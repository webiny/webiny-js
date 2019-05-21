// @flow
import gql from "graphql-tag";

const graphql = gql`
    query GetGoogleTagManager {
        settings {
            googleTagManager {
                data {
                    enabled
                    code
                }
            }
        }
    }
`;

export default graphql;
