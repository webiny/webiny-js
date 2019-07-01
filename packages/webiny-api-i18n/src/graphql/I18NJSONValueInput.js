export default /* GraphQL */ `
    input I18NJSONLocaleValueInput {
        value: JSON
        locale: String!
    }

    input I18NJSONValueInput {
        values: [I18NJSONLocaleValueInput]
    }
`;
