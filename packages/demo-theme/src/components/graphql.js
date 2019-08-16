// @flow
import gql from "graphql-tag";

export const getHeaderData = gql`
    query CmsGetHeader {
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
    query CmsGetSiteFooter {
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
