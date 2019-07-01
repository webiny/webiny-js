export default /* GraphQL */ `
    type I18NStringLocaleValue {
        value: String
        locale: String!
    }

    type I18NStringValue {
        value: String
        values: [I18NStringLocaleValue]!
    }
`;
