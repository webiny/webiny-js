import { gql } from "graphql-tag";

/**
 * TODO:
 * This query is a complete overkill, but it's the only way to bypass the double settings fetch
 * and cache key clash in the `website` app.
 */

export const GET_THEME = gql`
    query PbGetSettings {
        pageBuilder {
            getSettings {
                data {
                    name
                    social {
                        facebook
                        instagram
                        twitter
                        linkedIn
                        image {
                            src
                        }
                    }
                    logo {
                        src
                    }
                    favicon {
                        src
                    }
                    theme
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
