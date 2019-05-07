export default /* GraphQL */ `
    type Group {
        id: ID
        name: String
        slug: String
        createdOn: DateTime
        description: String
        roles: [Role]
    }
`;
