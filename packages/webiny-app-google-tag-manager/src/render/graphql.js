// @flow
import gql from "graphql-tag";

const graphql = gql`
    {
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
