export default /* GraphQL */ `
    input I18NStringLocaleValueInput {
        value: String
        locale: String!
    }

    input I18NStringValueInput {
        values: [I18NStringLocaleValueInput]
    }
`;
