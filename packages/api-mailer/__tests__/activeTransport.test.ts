import { describe, it, expect } from "vitest";
import { createContextHandler } from "./contextHandler";
import { ActiveTransport } from "~/domain/MailTransport/abstractions.js";

describe("ActiveTransport", () => {
    const { handle } = createContextHandler();

    it("returns the name of the last-registered transport factory", async () => {
        const context = await handle();
        const active = context.container.resolve(ActiveTransport);

        // DummyTransportFeature is registered before SmtpTransportFeature in
        // createMailerContext, so SmtpTransport is the last one — it wins.
        expect(active.name()).toBe("Mailer/SmtpTransport");
    });
});
