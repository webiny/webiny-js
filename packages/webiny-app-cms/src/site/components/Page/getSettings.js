// @flow
import gql from "graphql-tag";

export default gql`
    {
        settings {
            cms {
                name
                social {
                    image {
                        src
                    }
                }
            }
        }
    }
`;
