export const IS_INSTALLED_QUERY = `
    query IsSystemInstalled {
        system {
            isSystemInstalled {
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

export interface IsInstalledResponse {
    system: {
        isSystemInstalled: {
            data: boolean;
            error: {
                message: string;
                code: string;
                data: any;
            } | null;
        };
    };
}

export const INSTALL_MUTATION = `
    mutation InstallSystem($installationInput: JSON!) {
        system {
            installSystem(installationInput: $installationInput) {
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

export interface InstallResponse {
    system: {
        installSystem: {
            data: any;
            error: {
                message: string;
                code: string;
                data: any;
            } | null;
        };
    };
}
