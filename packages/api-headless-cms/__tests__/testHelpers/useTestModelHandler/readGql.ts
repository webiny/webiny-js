export const identityFields = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;

const data = /* GraphQL */ `
    {
        id
        entryId
        createdOn
        savedOn
        title
        slug
        meta {
            revisionCreatedOn
            revisionSavedOn
            revisionModifiedOn
            revisionFirstPublishedOn
            revisionLastPublishedOn
            revisionCreatedBy ${identityFields}
            revisionSavedBy ${identityFields}
            revisionModifiedBy ${identityFields}
            revisionFirstPublishedBy ${identityFields}
            revisionLastPublishedBy ${identityFields}
            entryCreatedOn
            entrySavedOn
            entryModifiedOn
            entryCreatedBy ${identityFields}
            entrySavedBy ${identityFields}
            entryModifiedBy ${identityFields}
            entryFirstPublishedBy ${identityFields}
            entryLastPublishedBy ${identityFields}
            entryFirstPublishedOn
            entryLastPublishedOn
        }
    }
`;

const errorFields = /* GraphQL */ `
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
            error ${errorFields}
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
            error ${errorFields}
            meta {
                cursor
                hasMoreItems
                totalCount
            }
        }
    }`;
