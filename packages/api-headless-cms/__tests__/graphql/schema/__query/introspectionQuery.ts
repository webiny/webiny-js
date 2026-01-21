const source = /* GraphQL */ `
    query IntrospectionQuery {
        __schema {
            types {
                name
                kind
                description
                fields {
                    name
                    description
                    type {
                        kind
                        name
                        ofType {
                            kind
                            name
                        }
                    }
                }
            }
        }
    }
`;
const operationName = "IntrospectionQuery";

export const introspectionQuery = {
    operationName,
    source
};
