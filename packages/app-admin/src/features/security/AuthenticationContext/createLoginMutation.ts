export const createLoginMutation = (identityType: string) => {
    return /* GraphQL */ `
        mutation Login {
            security {
                login {
                    data {
                        ... on ${identityType} {
                            id
                            displayName
                            type
                            profile {
                                email
                                firstName
                                lastName
                                avatar
                                gravatar
                            }
                            currentTenant {
                                id
                                name
                                description
                                image
                                parent
                            }
                            defaultTenant {
                                id
                                name
                                description
                                image
                                parent
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
