export const REDIRECT_FIELDS = /* GraphQL */ `
    id
    location {
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
`;
