import { createUpdateUserAction } from "~/worker/actions/updateUser/updateUserAction.js";
import {
    AdminGetUserCommand,
    type AdminGetUserCommandInput,
    AdminUpdateUserAttributesCommand,
    AdminUpdateUserAttributesCommandInput,
    CognitoIdentityProviderClient,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { mockClient } from "aws-sdk-client-mock";

describe("updateUserAction", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should fail to parse invalid input data", () => {
        console.log = jest.fn();

        const action = createUpdateUserAction({
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
        const action = createUpdateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = action.parse({
            username: "testUser",
            action: "updateUser",
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
            action: "updateUser",
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

    it("should update user", async () => {
        const mockedClient = mockClient(CognitoIdentityProviderClient);
        mockedClient.on(AdminGetUserCommand).callsFake((input: AdminGetUserCommandInput) => {
            return {
                $metadata: {
                    httpStatusCode: 200
                },
                UserAttributes: [
                    {
                        someAttribute: "someValue"
                    }
                ],
                Username: input.Username
            };
        });
        const send = jest.fn();
        mockedClient
            .on(AdminUpdateUserAttributesCommand)
            .callsFake((input: AdminUpdateUserAttributesCommandInput) => {
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

        const action = createUpdateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        const result = await action.handle({
            data: {
                username: "testUser",
                action: "updateUser",
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
            UserPoolId: "targetUserPool",
            Username: "testUser",
            UserAttributes: [
                {
                    someAttribute: "someValue"
                }
            ]
        });
    });

    it("should throw an error if source user does not exist", async () => {
        const mockedClient = mockClient(CognitoIdentityProviderClient);
        mockedClient.on(AdminGetUserCommand).callsFake(() => {
            return null;
        });

        const action = createUpdateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        try {
            const result = await action.handle({
                data: {
                    username: "testUser",
                    action: "updateUser",
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
            expect(result).toEqual("SHOULD NOT REACH HERE");
        } catch (ex) {
            expect(ex.message).toBe('Source user "testUser" not found in pool "sourceUserPool".');
        }
    });

    it("should throw an error if target user does not exist", async () => {
        const mockedClient = mockClient(CognitoIdentityProviderClient);
        mockedClient.on(AdminGetUserCommand).callsFake((input: AdminGetUserCommandInput) => {
            if (input.UserPoolId === "sourceUserPool") {
                return {
                    $metadata: {
                        httpStatusCode: 200
                    },
                    UserAttributes: [],
                    Username: input.Username
                };
            }
            return null;
        });

        const action = createUpdateUserAction({
            createCognitoProvider: createCognitoIdentityProviderClient
        });

        try {
            const result = await action.handle({
                data: {
                    username: "testUser",
                    action: "updateUser",
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
            expect(result).toEqual("SHOULD NOT REACH HERE");
        } catch (ex) {
            expect(ex.message).toBe(
                'Target user "testUser" does not exist in pool "targetUserPool".'
            );
        }
    });
});
