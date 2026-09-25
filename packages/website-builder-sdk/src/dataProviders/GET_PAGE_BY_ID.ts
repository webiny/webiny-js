export const GET_PAGE_BY_ID = /* GraphQL*/ `
    query GetPageById($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
                data {
                    id
                    version
                    properties
                    metadata
                    elements
                    bindings
                    extensions
                    languagePaths
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
