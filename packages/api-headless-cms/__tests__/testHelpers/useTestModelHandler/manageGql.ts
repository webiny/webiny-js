import type { CmsEntryListParams, CmsEntryStatus } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

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

export interface ITestEntryValues {
    title: string;
    slug?: string;
}

export interface ITestEntry {
    id: string;
    entryId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
    modifiedBy: {
        id: string;
        displayName: string;
        type: string;
    };
    savedBy: {
        id: string;
        displayName: string;
        type: string;
    };
    firstPublishedBy: {
        id: string;
        displayName: string;
        type: string;
    } | null;
    lastPublishedBy: {
        id: string;
        displayName: string;
        type: string;
    } | null;
    revisionCreatedOn: string;
    revisionModifiedOn: string;
    revisionSavedOn: string;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: {
        id: string;
        displayName: string;
        type: string;
    };
    revisionModifiedBy: {
        id: string;
        displayName: string;
        type: string;
    };
    revisionSavedBy: {
        id: string;
        displayName: string;
        type: string;
    };
    revisionFirstPublishedBy: {
        id: string;
        displayName: string;
        type: string;
    } | null;
    revisionLastPublishedBy: {
        id: string;
        displayName: string;
        type: string;
    } | null;
    meta: {
        title: string;
        modelId: string;
        version: number;
        locked: boolean;
        status: string;
        revisions: {
            id: string;
            values: {
                title: string;
                slug: string;
            };
            meta: {
                status: string;
                version: number;
            };
        }[];
        data: GenericRecord;
    };
    wbyAco_location: {
        folderId: string;
    };
    values: Required<ITestEntryValues>;
}

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

    meta {
        title
        modelId
        version
        locked
        status

        revisions {
            id
            values {
                title
                slug
            }
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
    values {
        title
        slug
    }
}`;

export interface IManageGetTestEntryVariables {
    revision?: string;
    entryId?: string;
    status?: CmsEntryStatus;
}

export const GET_TEST_ENTRY = /* GraphQL */ `
    query GetTestEntry($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
        getTestEntry: getTestEntry(revision: $revision, entryId: $entryId, status: $status) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IManageGetTestEntriesByIdsVariables {
    revisions: string[];
}

export const GET_TEST_ENTRIES_BY_IDS = /* GraphQL */ `
    query GetTestEntries($revisions: [ID!]!) {
        getTestEntriesByIds: getTestEntriesByIds(revisions: $revisions) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IManageListTestEntryVariables extends CmsEntryListParams {}

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

export interface ICreateTestEntryMutationVariables {
    data?: {
        values: ITestEntryValues;
    };
}

export const CREATE_TEST_ENTRY = /* GraphQL */ `
    mutation CreateTestEntry($data: TestEntryInput!) {
        createTestEntry: createTestEntry(data: $data) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface ICreateTestEntryFromMutationVariables {
    revision: string;
    data?: {
        values: ITestEntryValues;
    };
}

export const CREATE_TEST_ENTRY_FROM = /* GraphQL */ `
    mutation CreateTestEntryFrom($revision: ID!, $data: TestEntryInput) {
        createTestEntryFrom: createTestEntryFrom(revision: $revision, data: $data) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IUpdateTestEntryMutationVariables {
    revision: string;
    data: {
        values: ITestEntryValues;
    };
}

export const UPDATE_TEST_ENTRY = /* GraphQL */ `
    mutation UpdateTestEntry($revision: ID!, $data: TestEntryInput!) {
        updateTestEntry: updateTestEntry(revision: $revision, data: $data) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IMoveTestEntryMutationVariables {
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

export interface IDeleteTestEntryMutationVariables {
    revision: string;
}

export const DELETE_TEST_ENTRY = /* GraphQL */ `
    mutation DeleteTestEntry($revision: ID!) {
        deleteTestEntry: deleteTestEntry(revision: $revision) {
            data
            error ${errorFields}
        }
    }
`;

export interface IDeleteTestEntriesMutationVariables {
    entries: string[];
}

export const DELETE_TEST_ENTRIES = /* GraphQL */ `
    mutation DeleteTestEntries($entries: [ID!]!) {
        deleteTestEntries: deleteMultipleTestEntries(entries: $entries) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IPublishTestEntryMutationVariables {
    revision: string;
}

export const PUBLISH_TEST_ENTRY = /* GraphQL */ `
    mutation PublishTestEntry($revision: ID!) {
        publishTestEntry: publishTestEntry(revision: $revision) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IRepublishTestEntryMutationVariables {
    revision: string;
}

export const REPUBLISH_TEST_ENTRY = /* GraphQL */ `
    mutation RepublishTestEntry($revision: ID!) {
        republishTestEntry: republishTestEntry(revision: $revision) {
            data ${fields}
            error ${errorFields}
        }
    }
`;

export interface IUnpublishTestEntryMutationVariables {
    revision: string;
}

export const UNPUBLISH_TEST_ENTRY = /* GraphQL */ `
    mutation UnpublishTestEntry($revision: ID!) {
        unpublishTestEntry: unpublishTestEntry(revision: $revision) {
            data ${fields}
            error ${errorFields}
        }
    }
`;
