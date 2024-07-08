export const createFields = () => {
    return /* GraphQL */ `
        id
        createdOn
        createdBy {
            id
            displayName
            type
        }
        finishedOn
        modelId
        files {
            url
            expiresOn
        }
        status
    `;
};
