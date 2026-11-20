export const getPageGraphQLBaseFields = (): string[] => {
    return [
        `id`,
        `entryId`,
        `status`,
        `version`,
        `locked`,
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

// The published layout the page is rendered in (in the page's language), rendered around the page in the
// editor's preview. It comes as stored: the page editor composes the page's overrides of it.
export const PAGE_LAYOUT_GRAPHQL_FIELDS = `layout {
    id
    entryId
    properties
    elements
    bindings
}`;

export const getPageGraphQLFields = (extraFields: string[]): string[] => {
    return [...getPageGraphQLBaseFields(), ...extraFields];
};
