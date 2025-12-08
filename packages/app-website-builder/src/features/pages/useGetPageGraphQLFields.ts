export const useGetPageGraphQLFields = (fields: string[]): string[] => {
    return [
        `id`,
        `entryId`,
        `status`,
        `version`,
        `wbyAco_location {
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
        ...fields
    ];
};
