// @flow
import gql from "graphql-tag";

const graphql = gql`
    query GetGoogleTagManager {
        googleTagManager {
            getSettings {
                data {
                    enabled
                    code
                }
            }
        }
    }
`;

export default graphql;
