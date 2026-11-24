import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { SendGridMailTransport } from "~/api/SendGridMailTransport.js";

const config = { apiKey: "SG.key", from: "Webiny <no-reply@example.com>" };

const stubFetch = (response: Response) => {
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

const sentBody = (fetchMock: ReturnType<typeof stubFetch>) => {
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    return JSON.parse(init.body as string);
};

describe("SendGridMailTransport", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the message in SendGrid's shape and returns the message id header", async () => {
        const fetchMock = stubFetch(
            new Response(null, { status: 202, headers: { "x-message-id": "msg-1" } })
        );
        const transport = new SendGridMailTransport(config);

        const result = await transport.send({
            to: ["User <user@example.com>"],
            cc: ["cc@example.com"],
            subject: "Hello",
            text: "Plain",
            html: "<p>Html</p>",
            replyTo: "support@example.com"
        });

        expect(result).toEqual({ result: "msg-1", error: null });
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe("https://api.sendgrid.com/v3/mail/send");
        expect((init.headers as Record<string, string>).Authorization).toBe("Bearer SG.key");
        expect(sentBody(fetchMock)).toEqual({
            personalizations: [
                {
                    to: [{ email: "user@example.com", name: "User" }],
                    cc: [{ email: "cc@example.com" }]
                }
            ],
            from: { email: "no-reply@example.com", name: "Webiny" },
            reply_to: { email: "support@example.com" },
            subject: "Hello",
            content: [
                { type: "text/plain", value: "Plain" },
                { type: "text/html", value: "<p>Html</p>" }
            ]
        });
    });

    it("addresses a BCC-only message to the sender, since SendGrid requires `to`", async () => {
        const fetchMock = stubFetch(new Response(null, { status: 202 }));
        const transport = new SendGridMailTransport(config);

        await transport.send({ bcc: ["a@example.com"], subject: "Review", html: "<p>Hi</p>" });

        const [personalization] = sentBody(fetchMock).personalizations;
        expect(personalization.to).toEqual([{ email: "no-reply@example.com" }]);
        expect(personalization.bcc).toEqual([{ email: "a@example.com" }]);
    });

    it("joins SendGrid's error messages when the request is refused", async () => {
        stubFetch(
            new Response(
                JSON.stringify({
                    errors: [
                        { message: "The from address does not match a verified Sender Identity." },
                        { message: "Permission denied, wrong credentials" }
                    ]
                }),
                { status: 403 }
            )
        );
        const transport = new SendGridMailTransport(config);

        const result = await transport.send({ to: ["user@example.com"], subject: "Hello" });

        expect(result.result).toBeNull();
        expect(result.error?.message).toBe(
            "The from address does not match a verified Sender Identity.; Permission denied, wrong credentials"
        );
        expect(result.error?.code).toBe("SENDGRID_ERROR");
        expect(result.error?.data?.statusCode).toBe(403);
    });
});
