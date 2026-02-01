export const LIST_PUBLISHED_PAGES = /* GraphQL*/ `
    query ListPublishedPages($where: WbPagesListWhereInput) {
        websiteBuilder {
            listPages(where: $where) {
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
