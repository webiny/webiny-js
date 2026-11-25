import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createAppModule, type PulumiApp, type PulumiAppModule } from "@webiny/pulumi";

export interface CoreCognitoParams {
    protect: boolean;
    useEmailAsUsername: boolean;
    mfa?: boolean;
}

export type CoreCognito = PulumiAppModule<typeof CoreCognito>;

/**
 * Standard attributes users may change themselves (with their own access token). The
 * `*_verified` flags are left out, so users can't mark an address they don't own as verified.
 */
const STANDARD_USER_WRITABLE_ATTRIBUTES = [
    "address",
    "birthdate",
    "email",
    "family_name",
    "gender",
    "given_name",
    "locale",
    "middle_name",
    "name",
    "nickname",
    "phone_number",
    "picture",
    "preferred_username",
    "profile",
    "updated_at",
    "website",
    "zoneinfo"
];

/**
 * Attributes that users must never change themselves. `custom:id` is the Webiny identity id:
 * a user who could write it would sign in as any other user. Webiny sets it with Cognito admin
 * APIs, which `writeAttributes` doesn't restrict.
 */
export const USER_PROTECTED_ATTRIBUTES = ["custom:id"];

/**
 * Everything users could write before (all standard and all custom attributes of the pool,
 * including custom attributes a project adds to the schema), except the protected ones.
 * Cognito has no deny list for app clients, so the allowed list is built from the pool schema.
 */
export const getUserWritableAttributes = (
    schemas: pulumi.Input<aws.types.input.cognito.UserPoolSchema[] | undefined>
): pulumi.Output<string[]> => {
    return pulumi.output(schemas).apply(items => {
        const custom = (items || [])
            .map(schema => schema.name)
            .filter(name => !STANDARD_USER_WRITABLE_ATTRIBUTES.includes(name))
            .filter(name => !name.endsWith("_verified"))
            .map(name => (name.startsWith("custom:") ? name : `custom:${name}`));

        return [...new Set([...STANDARD_USER_WRITABLE_ATTRIBUTES, ...custom])].filter(name => {
            return !USER_PROTECTED_ATTRIBUTES.includes(name);
        });
    });
};

export const CoreCognito = createAppModule({
    name: "Cognito",
    config(app: PulumiApp, params: CoreCognitoParams) {
        const userPool = app.addResource(aws.cognito.UserPool, {
            name: "user-pool",
            config: {
                passwordPolicy: {
                    minimumLength: 8,
                    requireLowercase: false,
                    requireNumbers: false,
                    requireSymbols: false,
                    requireUppercase: false,
                    temporaryPasswordValidityDays: 7
                },
                adminCreateUserConfig: {
                    allowAdminCreateUserOnly: true
                },
                autoVerifiedAttributes: ["email"],
                emailConfiguration: {
                    emailSendingAccount: "COGNITO_DEFAULT"
                },
                // In a legacy setup we use email as username.
                // We need to provide a way for users to have this setup,
                // because changing it would require whole cognito pool to be recreated.
                usernameAttributes: params.useEmailAsUsername ? ["email"] : undefined,
                aliasAttributes: params.useEmailAsUsername ? undefined : ["preferred_username"],
                lambdaConfig: {},
                mfaConfiguration: params.mfa ? "ON" : "OFF",
                softwareTokenMfaConfiguration: params.mfa ? { enabled: true } : undefined,
                userPoolAddOns: {
                    advancedSecurityMode: "OFF" /* required */
                },
                verificationMessageTemplate: {
                    defaultEmailOption: "CONFIRM_WITH_CODE"
                },
                accountRecoverySetting: {
                    recoveryMechanisms: [{ name: "verified_email", priority: 1 }]
                },
                schemas: [
                    {
                        attributeDataType: "String",
                        name: "email",
                        required: true,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "2048",
                            minLength: "0"
                        }
                    },
                    {
                        attributeDataType: "String",
                        name: "family_name",
                        required: true,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "2048",
                            minLength: "0"
                        }
                    },
                    {
                        attributeDataType: "String",
                        name: "given_name",
                        required: true,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "2048",
                            minLength: "0"
                        }
                    },
                    {
                        attributeDataType: "String",
                        name: "id",
                        required: false,
                        developerOnlyAttribute: false,
                        mutable: true,
                        stringAttributeConstraints: {
                            maxLength: "36",
                            minLength: "0"
                        }
                    }
                ]
            },
            opts: {
                protect: params.protect
            }
        });

        const userPoolClient = app.addResource(aws.cognito.UserPoolClient, {
            name: "user-pool-client",
            config: {
                userPoolId: userPool.output.id,
                writeAttributes: getUserWritableAttributes(userPool.output.schemas),
                accessTokenValidity: 60,
                idTokenValidity: 60,
                refreshTokenValidity: 30,
                tokenValidityUnits: {
                    accessToken: "minutes",
                    idToken: "minutes",
                    refreshToken: "days"
                }
            }
        });

        return {
            userPool,
            userPoolClient
        };
    }
});
