import zod from "zod";
import {
    IWebsocketsEvent,
    IWebsocketsEventData,
    WebsocketsEventRequestContextEventType
} from "~/handler/types";
import {
    IWebsocketsEventValidator,
    IWebsocketsEventValidatorValidateParams
} from "./abstractions/IWebsocketsEventValidator";
import { createZodError } from "@webiny/utils";

const validation = zod.object({
    headers: zod.object({}).passthrough().optional(),
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
        .transform<IWebsocketsEventData>(value => {
            if (!value) {
                return null;
            }
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
        locale: zod.string(),
        messageId: zod.string().nullish(),
        action: zod.string(),
        data: zod.object({}).passthrough().nullish()
    })
    .passthrough()
    .optional();

export class WebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: IWebsocketsEventValidatorValidateParams
    ): Promise<IWebsocketsEvent<T>> {
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
                ...((bodyResult.data || {}) as T)
            }
        };
    }
}
