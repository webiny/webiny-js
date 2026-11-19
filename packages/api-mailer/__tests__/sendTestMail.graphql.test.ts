import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { createGraphQLHandler } from "./graphQLHandler";
import { registerProjectTransport } from "./helpers/registerProjectTransport";
import type { TransportSendData } from "~/types.js";

/*
 * The core mailer has no transport of its own. SMTP and its settings come from
 * `@webiny/mailer-smtp`, which has its own tests for sending through it.
 */
describe("Mailer sendTestMail GraphQL, without a transport package", () => {
    it("refuses when no transport is registered", async () => {
        const handler = createGraphQLHandler();

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response).toEqual({
            data: {
                mailer: {
                    sendTestMail: {
                        data: null,
                        error: {
                            code: "Mailer/SendTestMail/NotConfigured",
                            message:
                                "No mail transport is configured, so there is nothing to test.",
                            data: null
                        }
                    }
                }
            }
        });
    });

    it("goes through a transport the project registers", async () => {
        const send = vi.fn(async (_params: TransportSendData) => {
            return { result: "queued", error: null };
        });
        const handler = createGraphQLHandler({ plugins: [registerProjectTransport(send)] });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail).toEqual({ data: true, error: null });
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({
                to: ["admin@dummy-host.webiny"],
                subject: "Webiny test email"
            })
        );
    });

    it("returns the transport's error when delivery fails", async () => {
        const send = vi.fn(async (_params: TransportSendData) => {
            return {
                result: null,
                error: { message: "Email address is not verified.", code: "MessageRejected" }
            };
        });
        const handler = createGraphQLHandler({ plugins: [registerProjectTransport(send)] });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail.data).toBeNull();
        expect(response.data.mailer.sendTestMail.error).toMatchObject({
            code: "Mailer/MailerService/TransportSendError"
        });
    });

    it("refuses without the mailer.settings permission", async () => {
        const send = vi.fn(async () => ({ result: "queued", error: null }));
        const handler = createGraphQLHandler({
            permissions: [],
            plugins: [registerProjectTransport(send)]
        });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail.error.code).toBe(
            "Mailer/SendTestMail/NotAuthorized"
        );
        expect(send).not.toHaveBeenCalled();
    });

    it("has no settings fields, which come with a transport package", async () => {
        const handler = createGraphQLHandler();

        const [response] = await handler.introspect();

        const types: { name: string; fields: { name: string }[] | null }[] =
            response.data.__schema.types;
        const fieldsOf = (name: string) => {
            return types.find(type => type.name === name)?.fields?.map(field => field.name);
        };
        expect(fieldsOf("MailerMutation")).toEqual(["sendTestMail"]);
        expect(fieldsOf("Query")).not.toContain("mailer");
        expect(fieldsOf("MailerQuery")).toBeUndefined();
    });
});
