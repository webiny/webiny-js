import { createImplementation } from "@webiny/di";
import { GraphQLClient } from "@webiny/app/features/graphqlClient";
import { type InstallationInput, SystemInstallerGateway as Abstraction } from "./abstractions.js";

const IS_SYSTEM_INSTALLED = /* GraphQL */ `
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

const INSTALL_SYSTEM = /* GraphQL */ `
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

interface IsSystemInstalledResponse {
    system: {
        isSystemInstalled: {
            data: boolean;
            error?: {
                message: string;
                code: string;
                data: any;
            };
        };
    };
}

interface InstallSystemResponse {
    system: {
        installSystem: {
            data: boolean;
            error?: {
                message: string;
                code: string;
                data: any;
            };
        };
    };
}

class SystemInstallerGraphQLGateway implements Abstraction.Interface {
    constructor(private client: GraphQLClient.Interface) {}

    async isSystemInstalled(): Promise<boolean> {
        const response = await this.client.execute<IsSystemInstalledResponse>({
            query: IS_SYSTEM_INSTALLED
        });

        if (response.system.isSystemInstalled.error) {
            throw new Error(response.system.isSystemInstalled.error.message);
        }

        return response.system.isSystemInstalled.data;
    }

    async installSystem(data: InstallationInput): Promise<void> {
        const response = await this.client.execute<InstallSystemResponse>({
            query: INSTALL_SYSTEM,
            variables: {
                installationInput: data
            }
        });

        if (response.system.installSystem.error) {
            throw response.system.installSystem.error;
        }
    }
}

export const SystemInstallerGateway = createImplementation({
    abstraction: Abstraction,
    implementation: SystemInstallerGraphQLGateway,
    dependencies: [GraphQLClient]
});
