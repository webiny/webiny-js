export const identityFields = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;

export const errorFields = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export const fields = /* GraphQL */ `{
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    createdBy ${identityFields}
    modifiedBy ${identityFields}
    savedBy ${identityFields}
    firstPublishedBy ${identityFields}
    lastPublishedBy ${identityFields}
    revisionCreatedOn
    revisionModifiedOn
    revisionSavedOn
    revisionFirstPublishedOn
    revisionLastPublishedOn
    revisionCreatedBy ${identityFields}
    revisionModifiedBy ${identityFields}
    revisionSavedBy ${identityFields}
    revisionFirstPublishedBy ${identityFields}
    revisionLastPublishedBy ${identityFields}

    publishedOn
    ownedBy ${identityFields}
    
    meta {
        title
        modelId
        version
        locked
        status

        revisions {
            id
            title
            slug
            meta {
                status
                version
            }
        }
        data
    }
    wbyAco_location {
        folderId
    }
    title
    slug
}`;

export const GET_TEST_ENTRY = /* GraphQL */ `
    query GetTestEntry($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
        getTestEntry: getTestEntry(revision: $revision, entryId: $entryId, status: $status) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const GET_TEST_ENTRIES_BY_IDS = /* GraphQL */ `
    query GetTestEntries($revisions: [ID!]!) {
        getTestEntriesByIds: getTestEntriesByIds(revisions: $revisions) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const LIST_TEST_ENTRIES = /* GraphQL */ `
    query ListTestEntries(
        $where: TestEntryListWhereInput
        $sort: [TestEntryListSorter]
        $limit: Int
        $after: String
    ) {
        listTestEntries: listTestEntries(where: $where, sort: $sort, limit: $limit, after: $after) {
            data ${fields}
            error ${errorFields}
            meta {
                cursor
                hasMoreItems
                totalCount
            }
        }
    }
`;

export const CREATE_TEST_ENTRY = /* GraphQL */ `
    mutation CreateTestEntry($data: TestEntryInput!) {
        createTestEntry: createTestEntry(data: $data) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const CREATE_TEST_ENTRY_FROM = /* GraphQL */ `
    mutation CreateTestEntryFrom($revision: ID!, $data: TestEntryInput) {
        createTestEntryFrom: createTestEntryFrom(revision: $revision, data: $data) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const UPDATE_TEST_ENTRY = /* GraphQL */ `
    mutation UpdateTestEntry($revision: ID!, $data: TestEntryInput!) {
        updateTestEntry: updateTestEntry(revision: $revision, data: $data) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface MoveTestEntryVariables {
    revision: string;
    folderId: string;
}

export const MOVE_TEST_ENTRY = /* GraphQL */ `
    mutation MoveTestEntry($revision: ID!, $folderId: ID!) {
        moveTestEntry: moveTestEntry(revision: $revision, folderId: $folderId) {
            data
            error ${errorFields}
        }
    }
`;

export const DELETE_TEST_ENTRY = /* GraphQL */ `
    mutation DeleteTestEntry($revision: ID!) {
        deleteTestEntry: deleteTestEntry(revision: $revision) {
            data
            error ${errorFields}
        }
    }
`;

export const DELETE_TEST_ENTRIES = /* GraphQL */ `
    mutation DeleteTestEntries($entries: [ID!]!) {
        deleteTestEntries: deleteMultipleTestEntries(entries: $entries) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const PUBLISH_TEST_ENTRY = /* GraphQL */ `
    mutation PublishTestEntry($revision: ID!) {
        publishTestEntry: publishTestEntry(revision: $revision) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const REPUBLISH_TEST_ENTRY = /* GraphQL */ `
    mutation RepublishTestEntry($revision: ID!) {
        republishTestEntry: republishTestEntry(revision: $revision) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export const UNPUBLISH_TEST_ENTRY = /* GraphQL */ `
    mutation UnpublishTestEntry($revision: ID!) {
        unpublishTestEntry: unpublishTestEntry(revision: $revision) {
            data ${fields}
            error ${errorFields}
        }
    }
`;
