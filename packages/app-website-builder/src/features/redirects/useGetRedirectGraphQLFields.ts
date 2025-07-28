export const useGetRedirectGraphQLFields = () => {
    return /* GraphQL */ `
        {
            id
            wbyAco_location {
                folderId
            }
            createdOn
            createdBy {
                id
                displayName
            }
            savedOn
            savedBy {
                id
                displayName
            }
            modifiedOn
            modifiedBy {
                id
                displayName
            }
            redirectFrom
            redirectTo
            redirectType
            isEnabled
        }
    `;
};
