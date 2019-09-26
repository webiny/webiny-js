export default /* GraphQL */ `
    input FileInput {
        name: String
        size: Int
        type: String
        src: String
        tags: [String]
        meta: JSON
    }
`;
