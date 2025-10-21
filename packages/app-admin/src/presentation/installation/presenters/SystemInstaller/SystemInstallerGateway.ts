import { createImplementation } from "@webiny/di-container";
import { GraphQLClient } from "@webiny/app/features/graphqlClient";
import { SystemInstallerGateway as Abstraction } from "./abstractions.js";

const IS_SYSTEM_INSTALLED = /* GraphQL */ `
    query IsSystemInstalled {
        tenancy {
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
    mutation InstallSystem {
        tenancy {
            installSystem {
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
    tenancy: {
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
    tenancy: {
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
        const response = await this.client.execute<any, IsSystemInstalledResponse>({
            query: IS_SYSTEM_INSTALLED
        });

        if (response.tenancy.isSystemInstalled.error) {
            throw new Error(response.tenancy.isSystemInstalled.error.message);
        }

        return response.tenancy.isSystemInstalled.data;
    }

    async installSystem(): Promise<void> {
        const response = await this.client.execute<any, InstallSystemResponse>({
            mutation: INSTALL_SYSTEM
        });

        if (response.tenancy.installSystem.error) {
            throw new Error(response.tenancy.installSystem.error.message);
        }
    }
}

export const SystemInstallerGateway = createImplementation({
    abstraction: Abstraction,
    implementation: SystemInstallerGraphQLGateway,
    dependencies: [GraphQLClient]
});
