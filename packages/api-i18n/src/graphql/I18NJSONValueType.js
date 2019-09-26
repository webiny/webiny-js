export default prefix => /* GraphQL */ `
    type ${prefix}I18NJSONLocaleValue {
        value: JSON
        locale: String!
    }

    type ${prefix}I18NJSONValue {
        value: JSON
        values: [${prefix}I18NJSONLocaleValue]!
    }
`;
