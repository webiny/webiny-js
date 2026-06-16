import zod from "zod";
import type {
    IWebsocketsEvent,
    IWebsocketsEventData,
    WebsocketsEventType
} from "@webiny/api-websockets";
import type { IWebsocketsEventValidator } from "@webiny/api-websockets";
import { WebsocketsEventRequestContextEventType } from "~/handler/types.js";
import { createZodError } from "@webiny/utils";

const eventTypeMap: Record<WebsocketsEventRequestContextEventType, WebsocketsEventType> = {
    [WebsocketsEventRequestContextEventType.message]: "message",
    [WebsocketsEventRequestContextEventType.connect]: "connect",
    [WebsocketsEventRequestContextEventType.disconnect]: "disconnect"
};

const routeKeyMap: Record<string, string> = {
    "$connect": "connect",
    "$disconnect": "disconnect",
    "$default": "default"
};

const validation = zod
    .object({
        headers: zod.looseObject({}).optional(),
        requestContext: zod.object({
            connectionId: zod.string(),
            stage: zod.string(),
            connectedAt: zod.number(),
            domainName: zod.string(),
            eventType: zod.enum([
                WebsocketsEventRequestContextEventType.connect,
                WebsocketsEventRequestContextEventType.message,
                WebsocketsEventRequestContextEventType.disconnect
            ]),
            routeKey: zod.string()
        }),
        body: zod
            .string()
            .transform<IWebsocketsEventData>((value, context) => {
                if (!value) {
                    return undefined;
                }
                try {
                    return JSON.parse(value);
                } catch (ex) {
                    console.error(`Failed body validation: ${ex.message}`);
                    console.log(`Body: ${value}`);
                    context.addIssue({
                        path: [],
                        message: `Invalid JSON: ${ex.message}`,
                        code: zod.ZodIssueCode.custom,
                        fatal: true
                    });
                }
            })
            .optional()
    })
    .superRefine((output, context) => {
        if (output.requestContext.eventType !== WebsocketsEventRequestContextEventType.message) {
            return;
        } else if (output.body) {
            return;
        }
        context.addIssue({
            path: ["body"],
            message: "There must be a body defined when having a message event.",
            code: zod.ZodIssueCode.custom,
            fatal: true
        });
    });

const bodyValidation = zod
    .looseObject({
        token: zod.string(),
        tenant: zod.string(),
        messageId: zod.string().nullish(),
        action: zod.string(),
        data: zod.looseObject({}).nullish()
    })
    .optional();

export class AwsWebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>> {
        const result = await validation.safeParseAsync(input);
        if (!result.success) {
            throw createZodError(result.error);
        }
        const bodyResult = await bodyValidation.safeParseAsync(result.data.body);
        if (!bodyResult.success) {
            throw createZodError(bodyResult.error);
        }

        const rc = result.data.requestContext;

        return {
            headers: result.data.headers as Record<string, string>,
            context: {
                connectionId: rc.connectionId,
                connectedAt: rc.connectedAt,
                host: rc.domainName,
                eventType: eventTypeMap[rc.eventType as WebsocketsEventRequestContextEventType],
                route: routeKeyMap[rc.routeKey] || rc.routeKey,
                endpoint: `https://${rc.domainName}/${rc.stage}`
            },
            body: {
                ...((bodyResult.data || {}) as T)
            }
        };
    }
}
