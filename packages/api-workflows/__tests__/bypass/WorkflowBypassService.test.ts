import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";

const createService = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(WorkflowBypassService);
};

describe("WorkflowBypassService (D36, D62, R150)", () => {
    it("is inactive by default", async () => {
        const service = await createService();

        expect(service.isActive()).toBe(false);
    });

    it("is active inside the callback and inactive after it", async () => {
        const service = await createService();
        const seen: boolean[] = [];

        const result = await service.run(async () => {
            seen.push(service.isActive());
            await Promise.resolve();
            seen.push(service.isActive());
            return "done";
        });

        expect(result).toBe("done");
        expect(seen).toEqual([true, true]);
        expect(service.isActive()).toBe(false);
    });

    it("restores the flag when the callback throws", async () => {
        const service = await createService();

        const failing = service.run(async () => {
            throw new Error("automation failed");
        });

        await expect(failing).rejects.toThrow("automation failed");
        expect(service.isActive()).toBe(false);
    });

    it("keeps the outer run active when a nested run ends", async () => {
        const service = await createService();
        const seen: boolean[] = [];

        await service.run(async () => {
            await service.run(async () => {
                seen.push(service.isActive());
            });
            seen.push(service.isActive());
        });

        expect(seen).toEqual([true, true]);
        expect(service.isActive()).toBe(false);
    });

    it("is one instance per request container, so every consumer shares the flag", async () => {
        const { context } = await createContextHandler();
        const first = context.container.resolve(WorkflowBypassService);
        const second = context.container.resolve(WorkflowBypassService);
        const seen: boolean[] = [];

        await first.run(async () => {
            seen.push(second.isActive());
        });

        expect(seen).toEqual([true]);
        expect(second.isActive()).toBe(false);
    });
});
