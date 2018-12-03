// @flow
import gql from "graphql-tag";

const graphql = gql`
    query getSettings {
        settings {
            cookiePolicy {
                enabled
                position
                palette {
                    popup {
                        background
                        text
                    }
                    button {
                        background
                        text
                    }
                }
            }
        }
    }
`;

export default graphql;
