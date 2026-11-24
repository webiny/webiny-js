import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { MailTransportFactory } from "@webiny/api-mailer";
import { MailerResendFeature } from "~/api/MailerResendFeature.js";
import { ResendMailTransport } from "~/api/ResendMailTransport.js";

const createFactory = () => {
    const container = new Container();
    MailerResendFeature.register(container);
    return container.resolve(MailTransportFactory);
};

describe("ResendMailTransportFactory", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("is not configured without the API key and the sender", async () => {
        vi.stubEnv("WEBINY_API_RESEND_API_KEY", "");
        vi.stubEnv("WEBINY_API_RESEND_FROM", "no-reply@example.com");

        expect(await createFactory().createTransport()).toBeNull();
    });

    it("builds the transport when both are set", async () => {
        vi.stubEnv("WEBINY_API_RESEND_API_KEY", "re_key");
        vi.stubEnv("WEBINY_API_RESEND_FROM", "no-reply@example.com");

        expect(await createFactory().createTransport()).toBeInstanceOf(ResendMailTransport);
    });
});
