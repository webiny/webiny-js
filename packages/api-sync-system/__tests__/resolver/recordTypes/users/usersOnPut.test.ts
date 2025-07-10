import { CopyUser } from "~/resolver/recordTypes/users/CopyUser.js";
import { createUserOnPutPlugin } from "~/resolver/recordTypes/users/usersOnPut.js";
import { createElasticsearchMockTable, createRegularMockTable } from "~tests/mocks/table.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import {
    AdminGetUserCommand,
    CognitoIdentityProviderClient,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import {
    createLambdaClient,
    InvokeCommand,
    InvokeCommandInput,
    LambdaClient
} from "@webiny/aws-sdk/client-lambda/index.js";
import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import { mockClient } from "aws-sdk-client-mock";

describe("usersOnPut", () => {
    it("should be able to handle target record", async () => {
        // @ts-expect-error
        const copyUser = new CopyUser({});

        const plugin = createUserOnPutPlugin({
            copyUser
        });

        const result = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });

        expect(result).toBeTrue();
    });

    it("should not be able to handle", async () => {
        // @ts-expect-error
        const copyUser = new CopyUser({});

        const plugin = createUserOnPutPlugin({
            copyUser
        });

        const wrongCommandResult = plugin.canHandle({
            command: "delete",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });
        expect(wrongCommandResult).toBeFalse();

        const wrongTableResult = plugin.canHandle({
            command: "put",
            table: createElasticsearchMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });
        expect(wrongTableResult).toBeFalse();

        const missingTargetCognitoResult = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment({
                cognitoUserPoolId: ""
            }),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });
        expect(missingTargetCognitoResult).toBeFalse();

        const missingSourceCognitoResult = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment({
                cognitoUserPoolId: ""
            }),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });
        expect(missingSourceCognitoResult).toBeFalse();

        const wrongPkResult = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });
        expect(wrongPkResult).toBeFalse();

        const wrongSkResult = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "L",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsers.user"
            }
        });
        expect(wrongSkResult).toBeFalse();

        const wrongTypeResult = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {
                    email: "email@mail.com"
                },
                TYPE: "adminUsersUser"
            }
        });
        expect(wrongTypeResult).toBeFalse();

        const missingEmailResult = plugin.canHandle({
            command: "put",
            table: createRegularMockTable(),
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            item: {
                PK: "T#root#ADMIN_USER#",
                SK: "A",
                data: {},
                TYPE: "adminUsers.user"
            }
        });
        expect(missingEmailResult).toBeFalse();
    });

    it("should handle user create", async () => {
        const send = jest.fn();

        const mockedCognito = mockClient(CognitoIdentityProviderClient);
        mockedCognito.on(AdminGetUserCommand).resolves({
            $metadata: {
                httpStatusCode: 204
            }
        });
        const mockedLambda = mockClient(LambdaClient);
        mockedLambda.on(InvokeCommand).callsFake((input: InvokeCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });

        const copyUser = new CopyUser({
            createCognitoIdentityProviderClient,
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "someLambdaArn",
                    createLambdaClient
                });
            }
        });

        const plugin = createUserOnPutPlugin({
            copyUser
        });

        const result = await plugin.handle({
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            table: createRegularMockTable(),
            item: {
                PK: "T#root#ADMIN_USER#1",
                SK: "A",
                data: {
                    email: "test@test.com"
                }
            }
        });

        expect(result).toBeUndefined();

        expect(send).toHaveBeenCalledWith({
            FunctionName: "someLambdaArn",
            InvocationType: "Event",
            Payload: Buffer.from(
                JSON.stringify({
                    action: "createUser",
                    username: "test@test.com",
                    source: {
                        region: "us-east-1",
                        userPoolId: "cognitoUserPoolId"
                    },
                    target: {
                        region: "us-east-1",
                        userPoolId: "cognitoUserPoolId"
                    }
                })
            )
        });
    });

    it("should handle user update", async () => {
        const send = jest.fn();

        const mockedCognito = mockClient(CognitoIdentityProviderClient);
        mockedCognito.on(AdminGetUserCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const mockedLambda = mockClient(LambdaClient);
        mockedLambda.on(InvokeCommand).callsFake((input: InvokeCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });

        const copyUser = new CopyUser({
            createCognitoIdentityProviderClient,
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "someLambdaArn",
                    createLambdaClient
                });
            }
        });

        const plugin = createUserOnPutPlugin({
            copyUser
        });

        const result = await plugin.handle({
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            table: createRegularMockTable(),
            item: {
                PK: "T#root#ADMIN_USER#1",
                SK: "A",
                data: {
                    email: "test@test.com"
                }
            }
        });

        expect(result).toBeUndefined();

        expect(send).toHaveBeenCalledWith({
            FunctionName: "someLambdaArn",
            InvocationType: "Event",
            Payload: Buffer.from(
                JSON.stringify({
                    action: "updateUser",
                    username: "test@test.com",
                    source: {
                        region: "us-east-1",
                        userPoolId: "cognitoUserPoolId"
                    },
                    target: {
                        region: "us-east-1",
                        userPoolId: "cognitoUserPoolId"
                    }
                })
            )
        });
    });

    it("should fail to handle user delete", async () => {
        const mockedCognito = mockClient(CognitoIdentityProviderClient);
        mockedCognito.on(AdminGetUserCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const mockedLambda = mockClient(LambdaClient);
        mockedLambda.on(InvokeCommand).rejects("Unknown testing error.");

        const copyUser = new CopyUser({
            createCognitoIdentityProviderClient,
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "someLambdaArn",
                    createLambdaClient
                });
            }
        });

        const plugin = createUserOnPutPlugin({
            copyUser
        });

        console.error = jest.fn();
        console.log = jest.fn();

        const result = await plugin.handle({
            target: createMockTargetDeployment(),
            source: createMockSourceDeployment(),
            table: createRegularMockTable(),
            item: {
                PK: "T#root#ADMIN_USER#1",
                SK: "A",
                data: {
                    email: "test@test.com"
                }
            }
        });

        expect(result).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith("Error while handling users onPut plugin.");
        expect(console.log).toHaveBeenCalledWith({
            message: "Unknown testing error.",
            stack: expect.any(String)
        });
    });
});
