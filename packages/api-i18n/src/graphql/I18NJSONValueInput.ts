export default (prefix = "") => /* GraphQL */ `
    input ${prefix}I18NJSONLocaleValueInput {
        value: JSON
        locale: String!
    }

    input ${prefix}I18NJSONValueInput {
        values: [${prefix}I18NJSONLocaleValueInput]
    }
`;
