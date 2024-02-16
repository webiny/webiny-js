import zod from "zod";
import { ISocketsEvent, SocketsEventRequestContextEventType } from "~/handler/types";
import { ISocketsEventValidator } from "./abstractions/ISocketsEventValidator";
import { createZodError } from "@webiny/utils";

const validation = zod.object({
    requestContext: zod.object({
        connectionId: zod.string(),
        connectedAt: zod.number(),
        domainName: zod.string(),
        eventType: zod.enum([
            SocketsEventRequestContextEventType.connect,
            SocketsEventRequestContextEventType.disconnect,
            SocketsEventRequestContextEventType.message
        ]),
        messageId: zod.string().optional(),
        routeKey: zod.string(),
        requestId: zod.string(),
        extendedRequestId: zod.string(),
        apiId: zod.string(),
        authorizer: zod.object({
            principalId: zod.string()
        }),
        error: zod.object({
            messageString: zod.string(),
            validationErrorString: zod.string()
        }),
        identity: zod.object({
            accountId: zod.string(),
            apiKey: zod.string(),
            apiKeyId: zod.string(),
            caller: zod.string(),
            cognitoAuthenticationProvider: zod.string().optional(),
            cognitoAuthenticationType: zod.string().optional(),
            cognitoIdentityId: zod.string().optional(),
            cognitoIdentityPoolId: zod.string().optional(),
            sourceIp: zod.string(),
            user: zod.string(),
            userAgent: zod.string(),
            userArn: zod.string()
        }),
        requestTime: zod.string(),
        requestTimeEpoch: zod.number(),
        stage: zod.string(),
        status: zod.number()
    }),
    data: zod.object({
        identity: zod.object({
            id: zod.string()
        }),
        tenant: zod.string(),
        locale: zod.string()
    })
});

export class SocketsEventValidator implements ISocketsEventValidator {
    public async validate(event: Partial<ISocketsEvent>): Promise<ISocketsEvent> {
        const result = await validation.safeParseAsync(event);
        if (result.success) {
            return result.data;
        }
        throw createZodError(result.error);
    }
}
