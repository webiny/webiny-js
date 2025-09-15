import { createDeleteUserAction } from "~/worker/actions/deleteUser/deleteUserAction.js";
import type { AdminDeleteUserCommandInput } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import {
    AdminDeleteUserCommand,
    AdminGetUserCommand,
    type AdminGetUserCommandInput,
    CognitoIdentityProviderClient,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("deleteUserAction", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should fail to parse invalid input data", () => {
        console.log = vi.fn();

        const action = createDeleteUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = action.parse({
            unknownData: true
        });

        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith({
            message: "Validation failed.",
            code: "VALIDATION_FAILED_INVALID_FIELDS",
            data: {
                invalidFields: {
                    action: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["action"]
                        },
                        message: "Required"
                    },
                    target: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["target"]
                        },
                        message: "Required"
                    },
                    username: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["username"]
                        },
                        message: "Required"
                    }
                }
            },
            stack: expect.any(String)
        });
    });

    it("should successfully parse valid input data", () => {
        const action = createDeleteUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = action.parse({
            action: "deleteUser",
            target: {
                region: "us-east-1",
                userPoolId: "us-east-1_123456789"
            },
            username: "testUser"
        });

        expect(result).toEqual({
            action: "deleteUser",
            target: {
                region: "us-east-1",
                userPoolId: "us-east-1_123456789"
            },
            username: "testUser"
        });
    });

    it("should not delete user if it does not exist", async () => {
        const mockedClient = mockClient(CognitoIdentityProviderClient);
        mockedClient.on(AdminGetUserCommand).callsFake(() => {
            return null;
        });

        const action = createDeleteUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = await action.handle({
            data: {
                action: "deleteUser",
                target: {
                    region: "us-east-1",
                    userPoolId: "targetUserPool"
                },
                username: "testUser"
            }
        });
        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(
            `Target user "testUser" does not exist in pool "targetUserPool".`
        );
    });

    it("should delete user", async () => {
        const send = vi.fn();
        const mockedClient = mockClient(CognitoIdentityProviderClient);
        mockedClient.on(AdminGetUserCommand).callsFake((input: AdminGetUserCommandInput) => {
            return {
                $metadata: {
                    httpStatusCode: 200
                },
                UserAttributes: [],
                Username: input.Username
            };
        });
        mockedClient.on(AdminDeleteUserCommand).callsFake((input: AdminDeleteUserCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });

        const action = createDeleteUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = await action.handle({
            data: {
                action: "deleteUser",
                target: {
                    region: "us-east-1",
                    userPoolId: "targetUserPool"
                },
                username: "testUser"
            }
        });
        expect(result).toBeUndefined();
        expect(send).toHaveBeenCalledWith({
            UserPoolId: "targetUserPool",
            Username: "testUser"
        });
    });
});
