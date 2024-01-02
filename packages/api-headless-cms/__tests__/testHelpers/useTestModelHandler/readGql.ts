const data = /* GraphQL */ `
    {
        id
        entryId
        createdOn
        savedOn
        title
        slug
    }
`;

const error = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export const GET_TEST_ENTRY = `
    query GetTestEntry($where: TestEntryGetWhereInput!) {
        getTestEntry(where: $where) {
            data ${data}
            error ${error}
        }
    }`;

export const LIST_TEST_ENTRIES = `
    query ListTestEntries(
        $where: TestEntryListWhereInput
        $sort: [TestEntryListSorter]
        $limit: Int
        $after: String
    ) {
        listTestEntries(where: $where, sort: $sort, limit: $limit, after: $after) {
            data ${data}
            error ${error}
            meta {
                cursor
                hasMoreItems
                totalCount
            }
        }
    }`;
