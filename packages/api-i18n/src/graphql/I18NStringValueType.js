export default prefix => /* GraphQL */ `
    type ${prefix}I18NStringLocaleValue {
        value: String
        locale: String!
    }

    type ${prefix}I18NStringValue {
        value: String
        values: [${prefix}I18NStringLocaleValue]!
    }
`;
