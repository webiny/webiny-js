import gql from "graphql-tag";

export const GET_HEADER_DATA = gql`
    query PbGetHeader {
        pageBuilder {
            getSettings {
                data {
                    name
                    logo {
                        src
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const GET_FOOTER_DATA = gql`
    query PbGetSiteFooter {
        pageBuilder {
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
                error {
                    code
                    message
                }
            }
        }
    }
`;
