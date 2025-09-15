import { DeleteUser } from "~/resolver/recordTypes/users/DeleteUser.js";
import {
    AdminGetUserCommand,
    CognitoIdentityProviderClient,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import type { InvokeCommandInput } from "@webiny/aws-sdk/client-lambda/index.js";
import {
    createLambdaClient,
    InvokeCommand,
    LambdaClient
} from "@webiny/aws-sdk/client-lambda/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { describe, expect, it, vi } from "vitest";

describe("DeleteUser", () => {
    it("should delete a user from the target user pool", async () => {
        const send = vi.fn();
        const mockedCognitoClient = mockClient(CognitoIdentityProviderClient);
        mockedCognitoClient.on(AdminGetUserCommand).callsFake(() => {
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
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

        const deleteUser = new DeleteUser({
            createCognitoIdentityProviderClient,
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "someLambdaArn",
                    createLambdaClient
                });
            }
        });
        const result = await deleteUser.handle({
            target: {
                region: "us-east-1",
                services: {
                    cognitoUserPoolId: "targetUserPoolId"
                }
            },
            username: "testUser"
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
                    action: "deleteUser",
                    username: "testUser",
                    target: {
                        region: "us-east-1",
                        userPoolId: "targetUserPoolId"
                    }
                })
            )
        });
    });

    it("should not trigger a user deletion when user does not exist in the cognito pool", async () => {
        const send = vi.fn();
        const mockedCognitoClient = mockClient(CognitoIdentityProviderClient);
        mockedCognitoClient.on(AdminGetUserCommand).callsFake(() => {
            throw new Error("User does not exist.");
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

        const deleteUser = new DeleteUser({
            createCognitoIdentityProviderClient,
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "someLambdaArn",
                    createLambdaClient
                });
            }
        });
        const result = await deleteUser.handle({
            target: {
                region: "us-east-1",
                services: {
                    cognitoUserPoolId: "targetUserPoolId"
                }
            },
            username: "testUser"
        });

        expect(result).toEqual(null);
        expect(send).not.toHaveBeenCalled();
    });
});
