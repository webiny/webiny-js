// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
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
