// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
        settings {
            typeform {
                enabled
                apiKey
            }
        }
    }
`;

export default graphql;
