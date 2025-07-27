import {
    AdminGetUserCommand,
    CognitoIdentityProviderClient,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { CopyUser } from "~/resolver/recordTypes/users/CopyUser.js";
import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import {
    createLambdaClient,
    InvokeCommand,
    InvokeCommandInput,
    LambdaClient
} from "@webiny/aws-sdk/client-lambda/index.js";
import { mockClient } from "aws-sdk-client-mock";

describe("CopyUser", () => {
    it("should create a new user if it does not exist in the target user pool", async () => {
        const send = jest.fn();

        const mockedCognitoClient = mockClient(CognitoIdentityProviderClient);
        mockedCognitoClient.on(AdminGetUserCommand).callsFake(() => {
            throw new Error("User does not exist");
        });
        const mockedLambdaClient = mockClient(LambdaClient);
        mockedLambdaClient.on(InvokeCommand).callsFake((input: InvokeCommandInput) => {
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

        const result = await copyUser.handle({
            username: "testUser",
            source: {
                region: "us-east-1",
                services: {
                    cognitoUserPoolId: "sourceUserPoolId"
                }
            },
            target: {
                region: "us-east-1",
                services: {
                    cognitoUserPoolId: "targetUserPoolId"
                }
            }
        });

        expect(result).toEqual({
            $metadata: {
                httpStatusCode: 200
            }
        });
        expect(send).toHaveBeenCalledWith({
            FunctionName: "someLambdaArn",
            InvocationType: "Event",
            Payload: Buffer.from(
                JSON.stringify({
                    action: "createUser",
                    username: "testUser",
                    source: {
                        region: "us-east-1",
                        userPoolId: "sourceUserPoolId"
                    },
                    target: {
                        region: "us-east-1",
                        userPoolId: "targetUserPoolId"
                    }
                })
            )
        });
    });

    it("should update existing user", async () => {
        const send = jest.fn();

        const mockedCognitoClient = mockClient(CognitoIdentityProviderClient);
        mockedCognitoClient.on(AdminGetUserCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const mockedLambdaClient = mockClient(LambdaClient);
        mockedLambdaClient.on(InvokeCommand).callsFake((input: InvokeCommandInput) => {
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

        const result = await copyUser.handle({
            username: "testUser",
            source: {
                region: "us-east-1",
                services: {
                    cognitoUserPoolId: "sourceUserPoolId"
                }
            },
            target: {
                region: "us-east-1",
                services: {
                    cognitoUserPoolId: "targetUserPoolId"
                }
            }
        });

        expect(result).toEqual({
            $metadata: {
                httpStatusCode: 200
            }
        });
        expect(send).toHaveBeenCalledWith({
            FunctionName: "someLambdaArn",
            InvocationType: "Event",
            Payload: Buffer.from(
                JSON.stringify({
                    action: "updateUser",
                    username: "testUser",
                    source: {
                        region: "us-east-1",
                        userPoolId: "sourceUserPoolId"
                    },
                    target: {
                        region: "us-east-1",
                        userPoolId: "targetUserPoolId"
                    }
                })
            )
        });
    });
});
