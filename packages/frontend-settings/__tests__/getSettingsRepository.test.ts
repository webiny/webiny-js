import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import {
    GetFrontendSettingsGateway,
    GetFrontendSettingsRepository
} from "~/admin/features/getSettings/abstractions.js";
import { GetFrontendSettingsRepository as RepositoryImpl } from "~/admin/features/getSettings/GetFrontendSettingsRepository.js";
import { CACHE_KEY, settingsCache } from "~/admin/features/settingsCache.js";

/*
 * Every live preview consumer asks for the settings when it mounts. They must share one request,
 * and a failed request must not be cached, so a retry can still load the Frontend Domain.
 */
const createRepository = (execute: () => Promise<any>) => {
    const container = new Container();
    const gateway = { execute: vi.fn(execute) };
    container.registerInstance(GetFrontendSettingsGateway, gateway);
    container.register(RepositoryImpl);
    return { repository: container.resolve(GetFrontendSettingsRepository), gateway };
};

describe("GetFrontendSettingsRepository (admin)", () => {
    beforeEach(() => {
        settingsCache.delete(CACHE_KEY);
    });

    it("shares one request between concurrent callers", async () => {
        const settings = { domain: "https://example.com", starterKits: [] };
        const { repository, gateway } = createRepository(async () => settings);

        const results = await Promise.all([repository.execute(), repository.execute()]);

        expect(results).toEqual([settings, settings]);
        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(settingsCache.get(CACHE_KEY)).toEqual(settings);
    });

    it("does not cache a failed request", async () => {
        const settings = { domain: "https://example.com", starterKits: [] };
        let fail = true;
        const { repository, gateway } = createRepository(async () => {
            if (fail) {
                throw new Error("Network error");
            }
            return settings;
        });

        await expect(repository.execute()).rejects.toThrow("Network error");
        expect(settingsCache.has(CACHE_KEY)).toBe(false);

        fail = false;
        await expect(repository.execute()).resolves.toEqual(settings);
        expect(gateway.execute).toHaveBeenCalledTimes(2);
    });
});
