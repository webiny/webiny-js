import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { SendEmailCommand } from "@webiny/aws-sdk/client-sesv2/index.js";
import { SesMailTransport } from "~/api/SesMailTransport.js";

const config = { from: "Webiny <no-reply@example.com>", configurationSet: "tracking" };

describe("SesMailTransport", () => {
    it("sends a SendEmail command and returns the message id", async () => {
        const send = vi.fn(async () => ({ MessageId: "ses-1" }));
        const transport = new SesMailTransport({ send } as any, config);

        const result = await transport.send({
            to: ["user@example.com"],
            bcc: ["audit@example.com"],
            subject: "Hello",
            html: "<p>Html</p>"
        });

        expect(result).toEqual({ result: "ses-1", error: null });
        const [command] = send.mock.calls[0] as unknown as [SendEmailCommand];
        expect(command).toBeInstanceOf(SendEmailCommand);
        expect(command.input).toEqual({
            FromEmailAddress: "Webiny <no-reply@example.com>",
            ReplyToAddresses: undefined,
            Destination: {
                ToAddresses: ["user@example.com"],
                CcAddresses: undefined,
                BccAddresses: ["audit@example.com"]
            },
            Content: {
                Simple: {
                    Subject: { Data: "Hello", Charset: "UTF-8" },
                    Body: { Text: undefined, Html: { Data: "<p>Html</p>", Charset: "UTF-8" } }
                }
            },
            ConfigurationSetName: "tracking"
        });
    });

    it("returns the SDK error's name, message and request id", async () => {
        const error = Object.assign(new Error("Email address is not verified."), {
            name: "MessageRejected",
            $metadata: { requestId: "req-1" }
        });
        const send = vi.fn(async () => {
            throw error;
        });
        const transport = new SesMailTransport({ send } as any, config);

        const result = await transport.send({ to: ["user@example.com"], subject: "Hello" });

        expect(result).toEqual({
            result: null,
            error: {
                message: "Email address is not verified.",
                code: "MessageRejected",
                data: { requestId: "req-1" }
            }
        });
    });
});
