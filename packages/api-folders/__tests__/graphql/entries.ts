const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        id
        eId
        folderId
        ${extra}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_ENTRY = /* GraphQL */ `
    mutation CreateEntry($data: EntryCreateInput!) {
        folders {
            createEntry(data: $data) {
                data ${DATA_FIELD("id")}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_ENTRY = /* GraphQL */ `
    mutation UpdateEntry($id: ID!, $data: EntryUpdateInput!) {
        folders {
            updateEntry(id: $id, data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_ENTRY = /* GraphQL */ `
    mutation DeleteEntry($id: ID!) {
        folders {
            deleteEntry(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_ENTRIES = /* GraphQL */ `
    query ListEntries($where: EntriesListWhereInput!) {
        folders {
            listEntries(where: $where) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_ENTRY = /* GraphQL */ `
    query GetEntry($id: ID!) {
        folders {
            getEntry(id: $id ) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
