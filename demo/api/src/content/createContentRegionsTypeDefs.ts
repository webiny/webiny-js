export const createContentRegionsTypeDefs = (): string => {
    return /* GraphQL */ `
        type DemoContentRegionsResponse {
            data: [DemoContentRegion!]
            error: DemoError
        }
        
        type DemoLanguage {
            id: ID!
            name: String!
            slug: String!
        }
        
        type DemoContentRegion {
            id: ID!
            title: String!
            slug: String!
            languages: [DemoLanguage!]!
        }

        extend type DemoQuery {
            getContentRegions: DemoContentRegionsResponse!
        }
    `;
};
