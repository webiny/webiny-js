export interface IGraphQLMetaResponse {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export const META_FIELDS = /* GraphQL */ `
    {
        totalCount
        cursor
        hasMoreItems
    }
`;
