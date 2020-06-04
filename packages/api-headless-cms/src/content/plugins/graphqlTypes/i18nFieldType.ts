export const i18nFieldType = (name, type) => /* GraphQL */ `
    type ${name}Localized {
        value: ${type}
        locale: ID!
    }

    type ${name} {
        value(locale: String): ${type}
        values: [${name}Localized]!
    }
    
    type ${name}ListLocalized {
        value(locale: String): [${type}]
        locale: ID!
    }

    type ${name}List {
        value: [${type}]
        values: [${name}ListLocalized]!
    }
`;
