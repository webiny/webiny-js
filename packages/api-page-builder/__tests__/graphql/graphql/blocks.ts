export const DATA_FIELD = /* GraphQL */ `
    {
        id
        blockCategory
        preview
        name
        content
        type
        createdOn
        createdBy {
            id
            displayName
            type
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_BLOCK = /* GraphQL */ `
    mutation CreateBlock($data: PbCreateBlockInput!) {
        pageBuilder {
            createBlock(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
