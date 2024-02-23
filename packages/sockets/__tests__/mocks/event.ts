import {
    ISocketsEvent,
    ISocketsEventPartial,
    SocketsEventRequestContextEventType,
    SocketsEventRoute
} from "~/handler/types";

export const createMockEvent = (input: ISocketsEventPartial = {}): ISocketsEvent => {
    const { requestContext, data } = input || {};
    const { identity } = requestContext || {};
    return {
        queryStringParameters: {
            tenant: data?.tenant || "root",
            locale: data?.locale || "en-US",
            ...input.queryStringParameters
        },
        requestContext: {
            connectedAt: new Date().getTime(),
            connectionId: "myConnectionId",
            routeKey: SocketsEventRoute.default,
            domainName: "https://webiny.com",
            stage: "dev",
            apiId: "myApiId",
            requestId: "myRequestId",
            messageDirection: "IN",
            requestTime: new Date().toISOString(),
            requestTimeEpoch: new Date().getTime(),
            status: 200,
            eventType: SocketsEventRequestContextEventType.message,
            extendedRequestId: "myExtendedRequestId",
            messageId: "myMessageId",
            ...requestContext,
            identity: {
                user: "myUser",
                sourceIp: "0.0.0.0",
                accountId: "myAccountId",
                userAgent: "myUserAgent",
                apiKey: "myApiKey",
                apiKeyId: "myApiKeyId",
                caller: "myCaller",
                userArn: "myUserArn",
                cognitoIdentityId: "myCognitoIdentityId",
                cognitoIdentityPoolId: "myCognitoIdentityPoolId",
                cognitoAuthenticationProvider: "myCognitoAuthenticationProvider",
                cognitoAuthenticationType: "myCognitoAuthenticationType",
                ...identity
            },
            authorizer: {
                principalId: "myPrincipalId",
                ...requestContext?.authorizer
            },
            error: {
                messageString: requestContext?.error?.messageString || "myMessageString",
                validationErrorString: "myValidationErrorString",
                ...requestContext?.error
            }
        },
        data: {
            locale: "en-US",
            tenant: "root",
            ...data,
            identity: {
                id: "myIdentityId",
                ...data?.identity
            }
        }
    };
};
