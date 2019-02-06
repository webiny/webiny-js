// @flow
import gql from "graphql-tag";

export const getHeaderData = gql`
    query {
        settings {
            cms {
                name
                logo {
                    src
                }
            }
        }
    }
`;

export const getFooterData = gql`
    query {
        settings {
            cms {
                social {
                    facebook
                    instagram
                    twitter
                }
                name
                logo {
                    src
                }
            }
        }
    }
`;
