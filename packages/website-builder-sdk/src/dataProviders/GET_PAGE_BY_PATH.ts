export const GET_PAGE_BY_PATH = /* GraphQL*/ `
    query GetPageByPath($path: String!) {
        websiteBuilder {
            getPageByPath(path: $path) {
                data {
                    id
                    entryId
                    properties
                    elements
                    bindings
                    extensions
                    translations
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
