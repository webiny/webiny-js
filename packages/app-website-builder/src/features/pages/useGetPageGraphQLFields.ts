export const useGetPageGraphQLFields = (fields: string[]): string[] => {
    return [
        `id`,
        `entryId`,
        `status`,
        `version`,
        `location {
            folderId
        }`,
        `createdOn`,
        `createdBy {
            id
            displayName
        }`,
        `savedOn`,
        `savedBy {
            id
            displayName
        }`,
        `modifiedOn`,
        `modifiedBy {
            id
            displayName
        }`,
        `live {
            version
        }
        `,
        ...fields
    ];
};
