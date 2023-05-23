const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        id
        type
        title
        content
        location {
            folderId
        }
        tags
        data {
            id
            key
            name
            createdBy {
                id
                displayName
            }
            createdOn
            size
            aliases
            meta {
                private
            }
            type
        }
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

export const GET_RECORD = /* GraphQL */ `
    query GetRecord($id: ID!) {
        search {
            getRecord: getAcoSearchRecordFm(id: $id ) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
