export const INTROSPECTION = /* GraphQL */ `
    {
        __schema {
            types {
                name
                fields {
                    name
                    type {
                        name
                        kind
                        ofType {
                            name
                            kind
                        }
                    }
                }
            }
        }
    }
`;
