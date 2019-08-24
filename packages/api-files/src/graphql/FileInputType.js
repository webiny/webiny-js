export default /* GraphQL */ `
    input FileInput {
        id: ID
        name: String
        size: Int
        type: String
        src: String
        tags: [String]
        meta: JSON
    }
`;
