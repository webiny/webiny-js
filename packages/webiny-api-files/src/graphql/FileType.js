export default /* GraphQL */ `
    type File {
        id: ID
        name: String
        size: Int
        type: String
        src: String
        tags: [String]
        meta: JSON
        createdOn: String
    }
`;
