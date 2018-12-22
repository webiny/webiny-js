// @flow
import gql from "graphql-tag";

export const getHeaderData = gql`
    query {
        settings {
            general {
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
            general {
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
