import { createCreateUserAction } from "~/worker/actions/createUser/createUserAction.js";
import type { AdminCreateUserCommandInput } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import {
    AdminCreateUserCommand,
    AdminGetUserCommand,
    type AdminGetUserCommandInput,
    CognitoIdentityProviderClient,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("createUserAction", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should fail to parse invalid input data", () => {
        console.log = vi.fn();

        const action = createCreateUserAction({
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
                    source: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["source"]
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

    it("should parse valid input data", () => {
        const action = createCreateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = action.parse({
            username: "testUser",
            action: "createUser",
            source: {
                userPoolId: "sourceUserPool",
                region: "us-east-1"
            },
            target: {
                userPoolId: "targetUserPool",
                region: "us-east-1"
            }
        });
        expect(result).toEqual({
            username: "testUser",
            action: "createUser",
            source: {
                userPoolId: "sourceUserPool",
                region: "us-east-1"
            },
            target: {
                userPoolId: "targetUserPool",
                region: "us-east-1"
            }
        });
    });

    it("should copy a user", async () => {
        const mockedClient = mockClient(CognitoIdentityProviderClient);
        mockedClient.on(AdminGetUserCommand).callsFake((input: AdminGetUserCommandInput) => {
            if (input.UserPoolId === "targetUserPool") {
                return null;
            }
            return {
                $metadata: {
                    httpStatusCode: 200
                },
                UserAttributes: [],
                Username: input.Username
            };
        });
        const send = vi.fn();
        mockedClient.on(AdminCreateUserCommand).callsFake((input: AdminCreateUserCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                },
                User: {
                    Username: input.Username,
                    UserPoolId: input.UserPoolId,
                    Attributes: input.UserAttributes || []
                }
            };
        });

        const action = createCreateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = await action.handle({
            data: {
                username: "testUser",
                action: "createUser",
                source: {
                    userPoolId: "sourceUserPool",
                    region: "us-east-1"
                },
                target: {
                    userPoolId: "targetUserPool",
                    region: "us-east-1"
                }
            }
        });

        expect(result).toEqual(undefined);
        expect(send).toHaveBeenCalledWith({
            DesiredDeliveryMediums: [],
            ForceAliasCreation: false,
            MessageAction: "SUPPRESS",
            UserPoolId: "targetUserPool",
            Username: "testUser",
            UserAttributes: []
        });
    });
});
