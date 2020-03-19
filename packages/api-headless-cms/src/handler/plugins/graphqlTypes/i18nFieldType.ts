export const i18nFieldType = (name, type) => /* GraphQL */ `
    type ${name}Localized {
        value: ${type}
        locale: ID!
    }

    type ${name} {
        value: ${type}
        values: [${name}Localized]!
    }
`;
