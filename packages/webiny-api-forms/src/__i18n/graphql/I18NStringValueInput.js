export default /* GraphQL */ `
    input I18NStringLocaleValueInput {
        value: String
        locale: String!
    }

    input I18NStringValueInput {
        value: String
        values: [I18NStringLocaleValueInput]
    }
`;
