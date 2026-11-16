import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { MailTransportResolver } from "~/domain/MailTransport/abstractions.js";
import { DeliveringTransport } from "~/features/MailerService/index.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { GetSettingsRepository } from "~/features/GetSettings/abstractions.js";
import { DUMMY_TRANSPORT_NAME } from "~/constants.js";
import { SMTP_TRANSPORT_NAME } from "~/constants.js";
import type { TransportSettings } from "~/types.js";

const resolvedAs = (name: string, settings: TransportSettings | null) => {
    const resolved: MailTransportResolver.Resolved = {
        factory: {
            name,
            canUse: () => true,
            createTransport: async () => {
                throw new Error("Not used by these tests.");
            }
        },
        settings
    };

    return resolved;
};

const setup = (resolved: MailTransportResolver.Resolved | null) => {
    const container = new Container();

    container.registerInstance(GetSettingsRepository, {} as GetSettingsRepository.Interface);
    MailerServiceFeature.register(container);
    container.registerInstance(MailTransportResolver, { resolve: async () => resolved });

    return container.resolve(DeliveringTransport);
};

const SMTP_SETTINGS: TransportSettings = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "user",
    password: "password",
    from: "noreply@example.com",
    replyTo: "support@example.com"
};

describe("DeliveringTransport", () => {
    it("is null when no transport can be used", async () => {
        const transport = setup(null);

        expect(await transport.resolve()).toBeNull();
    });

    it("is null when mail would go out through the dummy transport", async () => {
        const transport = setup(resolvedAs(DUMMY_TRANSPORT_NAME, null));

        expect(await transport.resolve()).toBeNull();
    });

    it("names SMTP and the sender from its settings", async () => {
        const transport = setup(resolvedAs(SMTP_TRANSPORT_NAME, SMTP_SETTINGS));

        expect(await transport.resolve()).toEqual({
            name: SMTP_TRANSPORT_NAME,
            from: "noreply@example.com",
            replyTo: "support@example.com"
        });
    });

    it("names a transport the project registered, which has no stored settings", async () => {
        const transport = setup(resolvedAs("Acme/SesTransport", null));

        expect(await transport.resolve()).toEqual({
            name: "Acme/SesTransport",
            from: undefined,
            replyTo: undefined
        });
    });
});
