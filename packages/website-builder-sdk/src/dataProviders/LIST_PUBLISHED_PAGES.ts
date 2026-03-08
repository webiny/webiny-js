export const LIST_PUBLISHED_PAGES = /* GraphQL*/ `
    query ListPublishedPages(
        $where: WbPagesListWhereInput
        $limit: Int
        $after: String
        $sort: [WbPageListSorter]
        $search: String
    ) {
        websiteBuilder {
            listPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                data {
                    id
                    properties
                    metadata
                    extensions
                }
                meta {
                    hasMoreItems
                    totalCount
                    cursor
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
