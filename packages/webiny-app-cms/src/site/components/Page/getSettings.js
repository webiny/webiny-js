// @flow
import gql from "graphql-tag";

export default gql`
    {
        settings {
            cms {
                social {
                    image {
                        src
                    }
                }
            }
        }
    }
`;
