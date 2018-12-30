// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
        settings {
            googleTagManager {
                enabled
                code
            }
        }
    }
`;

export default graphql;
