export const createLoginMutation = () => {
    return /* GraphQL */ `
        mutation Login {
            security {
                login {
                    data {
                        id
                        displayName
                        type
                        roles {
                            id
                            slug
                            name
                        }
                        teams {
                            id
                            slug
                            name
                        }
                        profile {
                            firstName
                            lastName
                            email
                            avatar
                            external
                            createdOn
                        }
                        currentTenant {
                            id
                            name
                        }
                        defaultTenant {
                            id
                            name
                        }
                        tenants {
                            id
                            name
                        }
                        permissions
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
