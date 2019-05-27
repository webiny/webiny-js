// @flow
import gql from "graphql-tag";

export const getHeaderData = gql`
    query CmsGetHeader {
        settings {
            cms {
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
        settings {
            cms {
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
