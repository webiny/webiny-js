const entryFields = `
    id
    entryId
    title
    wbyAco_location {
        folderId
    }
`;

const DATA_FIELD = /* GraphQL */ `
    data {
        ${entryFields}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const META_FIELD = /* GraphQL */ `
    meta {
        cursor
        hasMoreItems
        totalCount
    }
`;

interface Entry {
    id: string;
    entryId: string;
    title: string;
    wbyAco_location?: {
        folderId?: string;
    };
}
export interface CmsError {
    code: string;
    message: string;
    data: any;
}
export interface GetEntryResult {
    data: {
        entry: {
            data: Entry | null;
            error: CmsError | null;
        };
    };
}

export type GetEntryInputVariables =
    | {
          revision: string;
          entryId?: never;
      }
    | {
          revision?: never;
          entryId: string;
      };
export const GET_ENTRY_QUERY = /* GraphQL */ `
    query GetEntryQuery($revision: ID, $entryId: ID) {
        entry: getTestAcoModel(revision: $revision, entryId: $entryId) {
            ${DATA_FIELD}
            ${ERROR_FIELD}
        }
    }
`;

export interface ListEntriesInputVariables {
    where?: {
        createdBy?: string;
        wbyAco_location?: {
            folderId?: string;
        };
    };
}

export interface ListEntriesResult {
    data: {
        entries: {
            data: Entry[] | null;
            error: CmsError | null;
        };
    };
}

export const LIST_ENTRIES_QUERY = /* GraphQL */ `
    query ListEntriesQuery($where: TestAcoModelListWhereInput) {
        entries: listTestAcoModels(where: $where) {
            ${DATA_FIELD}
            ${ERROR_FIELD}
            ${META_FIELD}
        }
    }
`;

export type CreateEntryResult = GetEntryResult;

export interface CreateEntryInputVariables {
    data: {
        id?: string;
        title: string;
        wbyAco_location?: {
            folderId: string;
        };
    };
}

export const CREATE_ENTRY_MUTATION = /* GraphQL */ `
    mutation CreateEntryMutation($data: TestAcoModelInput!) {
        entry: createTestAcoModel(data: $data) {
            ${DATA_FIELD}
            ${ERROR_FIELD}
        }
    }
`;

export type UpdateEntryResult = GetEntryResult;

export interface UpdateEntryInputVariables {
    revision: string;
    data: {
        title?: string;
    };
}

export const UPDATE_ENTRY_MUTATION = /* GraphQL */ `
    mutation UpdateEntryMutation($revision: ID!, $data: TestAcoModelInput!) {
        entry: updateTestAcoModel(revision: $revision, data: $data) {
            ${DATA_FIELD}
            ${ERROR_FIELD}
        }
    }
`;

export interface UpdateEntryLocationVariables {
    id: string;
    folderId: string;
}

export type UpdateEntryLocationResult = GetEntryResult;
export const UPDATE_ENTRY_LOCATION_MUTATION = /* GraphQL */ `
    mutation UpdateEntryLocationMutation($id: ID!, $folderId: ID!) {
        entry: updateTestAcoModelLocation(id: $id, folderId: $folderId) {
            ${DATA_FIELD}
            ${ERROR_FIELD}
        }
    }
`;
