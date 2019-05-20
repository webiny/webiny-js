// @flow
import gql from "graphql-tag";

const graphql = gql`
    {
        settings {
            cookiePolicy {
                data {
                    content {
                        href
                        message
                        dismiss
                        link
                    }
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
    }
`;

export default graphql;
