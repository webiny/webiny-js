// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
        settings {
            mailchimp {
                enabled
                apiKey
            }
        }
    }
`;

export default graphql;
