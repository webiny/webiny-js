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

        type DemoCompany {
            id: ID!
            name: String!
            logo: String!
        }

        type DemoCompanyResponse {
            data: DemoCompany
            error: DemoError
        }

        type DemoContentRegion {
            id: ID!
            title: String!
            slug: String!
            languages: [DemoLanguage!]!
        }

        extend type DemoQuery {
            getCompany: DemoCompanyResponse!
            getContentRegions: DemoContentRegionsResponse!
        }
    `;
};
