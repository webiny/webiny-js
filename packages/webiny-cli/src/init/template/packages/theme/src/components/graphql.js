// @flow
import gql from "graphql-tag";

export const getHeaderData = gql`
    query {
        cms {
            getSettings {
                data {
                    name
                    logo {
                        src
                    }
                }
            }
        }
    }
`;

export const getFooterData = gql`
    query {
        cms {
            getSettings {
                data {
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
    }
`;
