export interface IGraphQLIdentityInput {
    id: string;
    displayName: string;
    type: string;
}

export interface IGraphQLIdentityResponse {
    id: string;
    displayName: string;
    type: string;
}

export const IDENTITY_FIELDS = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;
