export const createLoginMutation = () => {
    return /* GraphQL */ `
        mutation Login {
            security {
                login {
                    data {
                        id
                        displayName
                        type
                        profile {
                            groups {
                                id
                                slug
                                name
                            }
                            teams {
                                id
                                slug
                                name
                            }
                            firstName
                            lastName
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
