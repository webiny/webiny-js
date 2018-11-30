// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
        settings {
            cookiePolicy {
                enabled
                palette {
                    popup
                    button
                }
            }
        }
    }
`;

export default graphql;
