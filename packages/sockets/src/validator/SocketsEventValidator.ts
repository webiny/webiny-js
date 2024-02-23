import zod from "zod";
import {
    ISocketsEvent,
    ISocketsEventData,
    SocketsEventRequestContextEventType
} from "~/handler/types";
import {
    ISocketsEventValidator,
    ISocketsEventValidatorValidateParams
} from "./abstractions/ISocketsEventValidator";
import { createZodError } from "@webiny/utils";

const validation = zod.object({
    headers: zod.object({}).passthrough().optional(),
    requestContext: zod.object({
        connectionId: zod.string(),
        connectedAt: zod.number(),
        domainName: zod.string(),
        eventType: zod.enum([
            SocketsEventRequestContextEventType.connect,
            SocketsEventRequestContextEventType.message,
            SocketsEventRequestContextEventType.disconnect
        ]),
        messageId: zod.string().optional(),
        routeKey: zod.string(),
        requestId: zod.string(),
        extendedRequestId: zod.string(),
        apiId: zod.string(),
        messageDirection: zod.string(),
        authorizer: zod
            .object({
                principalId: zod.string().optional()
            })
            .optional(),
        error: zod
            .object({
                messageString: zod.string().optional(),
                validationErrorString: zod.string().optional()
            })
            .optional(),
        identity: zod.object({
            accountId: zod.string().optional(),
            apiKey: zod.string().optional(),
            apiKeyId: zod.string().optional(),
            caller: zod.string().optional(),
            cognitoAuthenticationProvider: zod.string().optional(),
            cognitoAuthenticationType: zod.string().optional(),
            cognitoIdentityId: zod.string().optional(),
            cognitoIdentityPoolId: zod.string().optional(),
            userArn: zod.string().optional(),
            user: zod.string().optional(),
            sourceIp: zod.string(),
            userAgent: zod.string()
        }),
        requestTime: zod.string(),
        requestTimeEpoch: zod.number(),
        stage: zod.string(),
        status: zod.number().optional()
    }),
    body: zod
        .string()
        .transform<ISocketsEventData>(value => {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        })
        .optional()
});

const bodyValidation = zod
    .object({
        token: zod.string(),
        tenant: zod.string(),
        locale: zod.string()
    })
    .passthrough()
    .optional();

export class SocketsEventValidator implements ISocketsEventValidator {
    public async validate<T extends ISocketsEventData = ISocketsEventData>(
        input: ISocketsEventValidatorValidateParams
    ): Promise<ISocketsEvent<T>> {
        const result = await validation.safeParseAsync(input);
        if (!result.success) {
            throw createZodError(result.error);
        }
        const bodyResult = await bodyValidation.safeParseAsync(result.data.body);
        if (!bodyResult.success) {
            throw createZodError(bodyResult.error);
        }
        return {
            ...result.data,
            body: {
                ...(bodyResult.data as T)
            }
        };
    }
}
