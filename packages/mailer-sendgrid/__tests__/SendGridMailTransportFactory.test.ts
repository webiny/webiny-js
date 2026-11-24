import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { MailTransportFactory } from "@webiny/api-mailer";
import { MailerSendGridFeature } from "~/api/MailerSendGridFeature.js";
import { SendGridMailTransport } from "~/api/SendGridMailTransport.js";

const createFactory = () => {
    const container = new Container();
    MailerSendGridFeature.register(container);
    return container.resolve(MailTransportFactory);
};

describe("SendGridMailTransportFactory", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("is not configured without the API key and the sender", async () => {
        vi.stubEnv("WEBINY_API_SENDGRID_API_KEY", "SG.key");
        vi.stubEnv("WEBINY_API_SENDGRID_FROM", "");

        expect(await createFactory().createTransport()).toBeNull();
    });

    it("builds the transport when both are set", async () => {
        vi.stubEnv("WEBINY_API_SENDGRID_API_KEY", "SG.key");
        vi.stubEnv("WEBINY_API_SENDGRID_FROM", "no-reply@example.com");

        expect(await createFactory().createTransport()).toBeInstanceOf(SendGridMailTransport);
    });
});
