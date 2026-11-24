import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { MailTransportFactory } from "@webiny/api-mailer";
import { MailerSesFeature } from "~/api/MailerSesFeature.js";
import { SesMailTransport } from "~/api/SesMailTransport.js";

const createFactory = () => {
    const container = new Container();
    MailerSesFeature.register(container);
    return container.resolve(MailTransportFactory);
};

describe("SesMailTransportFactory", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("is not configured without a sender", async () => {
        vi.stubEnv("WEBINY_API_SES_FROM", "");

        expect(await createFactory().createTransport()).toBeNull();
    });

    it("builds the transport when the sender is set, without any credentials", async () => {
        vi.stubEnv("WEBINY_API_SES_FROM", "no-reply@example.com");
        vi.stubEnv("WEBINY_API_SES_REGION", "eu-central-1");

        expect(await createFactory().createTransport()).toBeInstanceOf(SesMailTransport);
    });
});
