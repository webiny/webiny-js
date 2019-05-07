export default /* GraphQL */ `
    type Role {
        id: ID
        name: String
        slug: String
        createdOn: DateTime
        description: String
        scopes: [String]
    }
`;
