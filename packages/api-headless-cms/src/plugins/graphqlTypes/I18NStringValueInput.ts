export default (prefix = "") => /* GraphQL */ `
    input ${prefix}I18NStringLocaleValueInput {
        value: String
        locale: String!
    }

    input ${prefix}I18NStringValueInput {
        values: [${prefix}I18NStringLocaleValueInput]
    }
`;
