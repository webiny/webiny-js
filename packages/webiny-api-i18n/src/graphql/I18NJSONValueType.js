export default /* GraphQL */ `
    type I18NJSONLocaleValue {
        value: JSON
        locale: String!
    }

    type I18NJSONValue {
        value: JSON
        values: [I18NJSONLocaleValue]!
    }
`;
