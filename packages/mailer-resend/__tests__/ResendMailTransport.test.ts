import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { ResendMailTransport } from "~/api/ResendMailTransport.js";

const config = { apiKey: "re_key", from: "Webiny <no-reply@example.com>" };

const stubFetch = (status: number, body: unknown) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

const sentBody = (fetchMock: ReturnType<typeof stubFetch>) => {
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    return JSON.parse(init.body as string);
};

describe("ResendMailTransport", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the message with the API key and returns Resend's id", async () => {
        const fetchMock = stubFetch(200, { id: "email-1" });
        const transport = new ResendMailTransport(config);

        const result = await transport.send({
            to: ["user@example.com"],
            subject: "Hello",
            text: "Plain",
            html: "<p>Html</p>"
        });

        expect(result).toEqual({ result: "email-1", error: null });
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe("https://api.resend.com/emails");
        expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_key");
        expect(sentBody(fetchMock)).toEqual({
            from: "Webiny <no-reply@example.com>",
            to: ["user@example.com"],
            subject: "Hello",
            text: "Plain",
            html: "<p>Html</p>"
        });
    });

    it("addresses a BCC-only message to the sender, since Resend requires `to`", async () => {
        const fetchMock = stubFetch(200, { id: "email-2" });
        const transport = new ResendMailTransport(config);

        await transport.send({ bcc: ["a@example.com", "b@example.com"], subject: "Review" });

        const body = sentBody(fetchMock);
        expect(body.to).toEqual(["no-reply@example.com"]);
        expect(body.bcc).toEqual(["a@example.com", "b@example.com"]);
    });

    it("returns Resend's error message and name when the request is refused", async () => {
        stubFetch(403, { name: "validation_error", message: "The domain is not verified." });
        const transport = new ResendMailTransport(config);

        const result = await transport.send({ to: ["user@example.com"], subject: "Hello" });

        expect(result).toEqual({
            result: null,
            error: {
                message: "The domain is not verified.",
                code: "validation_error",
                data: { statusCode: 403 }
            }
        });
    });

    it("returns an error when the request does not complete", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("getaddrinfo ENOTFOUND api.resend.com");
            })
        );
        const transport = new ResendMailTransport(config);

        const result = await transport.send({ to: ["user@example.com"], subject: "Hello" });

        expect(result.error).toEqual({
            message: "getaddrinfo ENOTFOUND api.resend.com",
            code: "RESEND_REQUEST_FAILED",
            data: {}
        });
    });
});
