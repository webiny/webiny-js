export const IS_INSTALLED_QUERY = /* GraphQL */ `
    query IsCmsInstalled {
        cms {
            isInstalled {
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

export const INSTALL_MUTATION = /* GraphQL */ `
    mutation CmsInstall {
        cms {
            install {
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

export const IS_SYSTEM_UPGRADE_AVAILABLE_QUERY = /* GraphQL */ `
    query IsSystemUpgradeAvailable {
        cms {
            isSystemUpgradeAvailable {
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

export const SYSTEM_UPGRADE_MUTATION = /* GraphQL */ `
    mutation SystemUpgrade {
        cms {
            systemUpgrade {
                data {
                    plugins
                    results
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
