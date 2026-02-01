export const GET_PAGE_BY_ID = /* GraphQL*/ `
    query GetPageById($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
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
