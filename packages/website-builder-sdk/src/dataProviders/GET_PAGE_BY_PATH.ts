export const GET_PAGE_BY_PATH = /* GraphQL*/ `
    query GetPageByPath($path: String!) {
        websiteBuilder {
            getPageByPath(path: $path) {
                data {
                    id
                    version
                    properties
                    metadata
                    elements
                    bindings
                    extensions
                    languagePaths
                    layout {
                        id
                        elements
                        bindings
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
