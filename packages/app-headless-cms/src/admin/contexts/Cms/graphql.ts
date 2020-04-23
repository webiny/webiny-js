import gql from "graphql-tag";

// Fetches data needed for constructing environments list (top-right menu).
export const LIST_ENVIRONMENTS_SELECTOR_ENVIRONMENTS = gql`
    query HeadlessCmsEnvironmentSelectorEnvironmentsList {
        cms {
            listEnvironments(sort: { name: 1 }, limit: 100) {
                data {
                    id
                    name
                    isProduction
                    environmentAlias {
                        id
                        name
                        isProduction
                    }
                }
            }
        }
    }
`;
