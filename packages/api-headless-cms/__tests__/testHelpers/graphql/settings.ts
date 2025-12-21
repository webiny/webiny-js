export const IS_INSTALLED_QUERY = /* GraphQL */ `
    query IsInstalled {
        system {
            isSystemInstalled {
                data
            }
        }
    }
`;

export const INSTALL_MUTATION = /* GraphQL */ `
    mutation CmsInstall {
        system {
            installSystem(installationInput: []) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
