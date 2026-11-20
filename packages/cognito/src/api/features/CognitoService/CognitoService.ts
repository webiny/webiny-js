import type { AdminCreateUserRequest } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { CognitoConfig, CognitoService as ServiceAbstraction } from "./abstractions.js";
import { adminDeleteSoftwareToken } from "./adminDeleteSoftwareToken.js";

class CognitoServiceImpl implements ServiceAbstraction.Interface {
    private cognito: CognitoIdentityProvider;

    constructor(private config: CognitoConfig.Interface) {
        this.cognito = new CognitoIdentityProvider({ region: config.region });
    }

    async getUser(username: string): Promise<ServiceAbstraction.User | null> {
        try {
            const response = await this.cognito.adminGetUser({
                Username: username,
                UserPoolId: this.config.userPoolId
            });

            const attributes: Record<string, string> = {};
            for (const attribute of response.UserAttributes ?? []) {
                if (attribute.Name) {
                    attributes[attribute.Name] = attribute.Value ?? "";
                }
            }

            return { username: response.Username ?? username, attributes };
        } catch (error) {
            if ((error as Error).name === "UserNotFoundException") {
                return null;
            }
            throw error;
        }
    }

    async createUser(params: {
        username: string;
        temporaryPassword: string;
        attributes: ServiceAbstraction.UserAttributes;
    }): Promise<void> {
        const createUserParams: AdminCreateUserRequest = {
            UserPoolId: this.config.userPoolId,
            Username: params.username,
            DesiredDeliveryMediums: [],
            ForceAliasCreation: false,
            MessageAction: "SUPPRESS",
            TemporaryPassword: params.temporaryPassword,
            UserAttributes: [
                {
                    Name: "given_name",
                    Value: params.attributes.givenName || ""
                },
                {
                    Name: "family_name",
                    Value: params.attributes.familyName || ""
                },
                {
                    Name: "preferred_username",
                    Value: params.attributes.preferredUsername
                },
                {
                    Name: "email",
                    Value: params.attributes.email
                },
                {
                    Name: "custom:id",
                    Value: params.attributes.customId
                }
            ]
        };

        await this.cognito.adminCreateUser(createUserParams);
    }

    async setEmailVerified(username: string): Promise<void> {
        await this.cognito.adminUpdateUserAttributes({
            UserPoolId: this.config.userPoolId,
            Username: username,
            UserAttributes: [
                {
                    Name: "email_verified",
                    Value: "true"
                }
            ]
        });
    }

    async setPermanentPassword(username: string, password: string): Promise<void> {
        await this.cognito.adminSetUserPassword({
            Permanent: true,
            Password: password,
            Username: username,
            UserPoolId: this.config.userPoolId
        });
    }

    async updateUserAttributes(
        username: string,
        attributes: Record<string, string>
    ): Promise<void> {
        const userAttributes = Object.entries(attributes).map(([name, value]) => ({
            Name: name,
            Value: value
        }));

        await this.cognito.adminUpdateUserAttributes({
            UserPoolId: this.config.userPoolId,
            Username: username,
            UserAttributes: userAttributes
        });
    }

    async deleteUser(username: string): Promise<void> {
        await this.cognito.adminDeleteUser({
            UserPoolId: this.config.userPoolId,
            Username: username
        });
    }

    async resetMfa(username: string): Promise<void> {
        // Deletes the user's TOTP software token, so Cognito asks them to set up TOTP again on
        // their next sign-in. Only turning the factor off (`AdminSetUserMFAPreference`) isn't
        // enough: with MFA required in the pool, Cognito keeps asking for the old token.
        // A signed request, not the SDK command: see `adminDeleteSoftwareToken`.
        await adminDeleteSoftwareToken({
            region: this.config.region,
            userPoolId: this.config.userPoolId,
            username,
            credentials: this.cognito.config.credentials
        });
    }
}

export const CognitoService = ServiceAbstraction.createImplementation({
    implementation: CognitoServiceImpl,
    dependencies: [CognitoConfig]
});
