// @flow
import gql from "graphql-tag";

export default gql`
    {
        settings {
            cms {
                data {
                    name
                    social {
                        image {
                            src
                        }
                    }
                }
            }
        }
    }
`;
