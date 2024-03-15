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

const validation = zod
    .object({
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
            .transform<IWebsocketsEventData>((value, context) => {
                if (!value) {
                    return undefined;
                }
                try {
                    return JSON.parse(value);
                } catch (ex) {
                    /**
                     * We want to log the error, for easier debugging.
                     */
                    console.error(`Failed body validation: ${ex.message}`);
                    console.log(`Body: ${value}`);
                    /**
                     * And we want to add an issue to the context, so that the user knows what went wrong.
                     */
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
