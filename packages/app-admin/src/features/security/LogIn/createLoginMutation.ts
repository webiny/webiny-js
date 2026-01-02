export const createLoginMutation = (identityType: string, fieldSelections: string[]) => {
    return /* GraphQL */ `
        mutation Login {
            security {
                login {
                    data {
                        ... on ${identityType} {
                            id
                            displayName
                            type
                            ${fieldSelections.join("\n")}
                            currentTenant {
                                id
                                name
                            }
                            defaultTenant {
                                id
                                name
                            }
                            permissions
                        }
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};
