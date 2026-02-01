export const GET_PAGE_BY_PATH = /* GraphQL*/ `
    query GetPageByPath($path: String!) {
        websiteBuilder {
            getPageByPath(path: $path) {
                data {
                    id
                    properties
                    elements
                    bindings
                    extensions
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
