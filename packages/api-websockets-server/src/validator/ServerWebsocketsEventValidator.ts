import zod from "zod";
import { WebsocketsEventValidator, WebsocketsRunner } from "@webiny/api-websockets/exports/api.js";
import { createZodError } from "@webiny/utils";

const eventTypeEnum = zod.enum(["message", "connect", "disconnect"]);

const contextValidation = zod.object({
    connectionId: zod.string(),
    connectedAt: zod.number(),
    host: zod.string(),
    eventType: eventTypeEnum,
    route: zod.string(),
    endpoint: zod.string()
});

const bodyValidation = zod
    .looseObject({
        token: zod.string().optional(),
        tenant: zod.string().optional(),
        messageId: zod.string().nullish(),
        action: zod.string().optional(),
        data: zod.looseObject({}).nullish()
    })
    .optional();

const validation = zod
    .object({
        headers: zod.looseObject({}).optional(),
        context: contextValidation,
        body: bodyValidation
    })
    .superRefine((output, ctx) => {
        if (output.context.eventType !== "message") {
            return;
        }
        if (!output.body) {
            ctx.addIssue({
                path: ["body"],
                message: "Message event must have a body.",
                code: zod.ZodIssueCode.custom,
                fatal: true
            });
        }
    });

export class ServerWebsocketsEventValidator implements WebsocketsEventValidator.Interface {
    public async validate<T extends WebsocketsRunner.EventData = WebsocketsRunner.EventData>(
        input: unknown
    ): Promise<WebsocketsRunner.Event<T>> {
        const result = await validation.safeParseAsync(input);
        if (!result.success) {
            throw createZodError(result.error);
        }

        const event: WebsocketsRunner.Event<T> = {
            headers: result.data.headers as Record<string, string>,
            context: result.data.context,
            body: result.data.body as T
        };

        /* Use body.action as custom route if provided. */
        if (event.context.eventType === "message" && event.body?.action) {
            event.context.route = event.body.action;
        }

        return event;
    }
}
