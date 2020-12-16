import gql from "graphql-tag";

// Fetches data needed for constructing environments list in the main menu.
export const LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS = gql`
    query CmsEnvironmentSelectorEnvironmentsList {
        cms {
            listEnvironments {
                data {
                    id
                    name
                    slug
                    isProduction
                    aliases {
                        id
                        name
                        isProduction
                        url {
                            manage
                            read
                            preview
                        }
                    }
                }
                error {
                    data
                    code
                    message
                }
            }
        }
    }
`;
