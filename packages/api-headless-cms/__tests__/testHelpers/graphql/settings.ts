export const IS_INSTALLED_QUERY = /* GraphQL */ `
    query IsCmsInstalled {
        cms {
            version
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

export const UPGRADE_MUTATION = /* GraphQL */ `
    mutation CmsUpgrade($version: String!) {
        cms {
            upgrade(version: $version) {
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
