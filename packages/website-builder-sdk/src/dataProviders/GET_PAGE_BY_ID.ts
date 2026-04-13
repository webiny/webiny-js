export const GET_PAGE_BY_ID = /* GraphQL*/ `
    query GetPageById($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
                data {
                    id
                    entryId
                    properties
                    elements
                    bindings
                    extensions
                    translations {
                        languageCode
                        path
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
