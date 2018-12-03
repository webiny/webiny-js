// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
        settings {
            googleTagManager {
                enabled
                body
                head
            }
        }
    }
`;

export default graphql;
