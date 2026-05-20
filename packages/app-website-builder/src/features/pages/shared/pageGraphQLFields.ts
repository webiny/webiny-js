export const getPageGraphQLBaseFields = (): string[] => {
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
        `revisionDescription`
    ];
};

export const getPageGraphQLFields = (extraFields: string[]): string[] => {
    return [...getPageGraphQLBaseFields(), ...extraFields];
};
