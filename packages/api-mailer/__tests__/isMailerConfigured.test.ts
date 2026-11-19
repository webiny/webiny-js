import { describe, expect, it } from "vitest";
import { createContextHandler } from "./contextHandler.js";
import { registerProjectTransport } from "./helpers/registerProjectTransport.js";
import { IsMailerConfiguredUseCase } from "~/features/IsMailerConfigured/index.js";

describe("IsMailerConfiguredUseCase", () => {
    it("is false when no transport is registered", async () => {
        const { handle } = createContextHandler();
        const context = await handle();

        expect(await context.container.resolve(IsMailerConfiguredUseCase).execute()).toBe(false);
    });

    it("is false when the registered transport is not configured", async () => {
        const { handle } = createContextHandler({ plugins: [registerProjectTransport(null)] });
        const context = await handle();

        expect(await context.container.resolve(IsMailerConfiguredUseCase).execute()).toBe(false);
    });

    it("is true when a registered transport is configured", async () => {
        const send = async () => ({ result: "queued", error: null });
        const { handle } = createContextHandler({ plugins: [registerProjectTransport(send)] });
        const context = await handle();

        expect(await context.container.resolve(IsMailerConfiguredUseCase).execute()).toBe(true);
    });
});
