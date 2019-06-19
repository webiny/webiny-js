export default /* GraphQL */ `
    input I18NJSONLocaleValueInput {
        value: JSON
        locale: String!
    }

    input I18NJSONValueInput {
        value: JSON
        values: [I18NJSONLocaleValueInput]
    }
`;
