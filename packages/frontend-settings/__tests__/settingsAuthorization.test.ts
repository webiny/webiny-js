import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    FrontendGetSettingsUseCase,
    FrontendGetSettingsRepository
} from "~/api/features/getSettings/abstractions.js";
import { FrontendGetSettingsUseCase as GetSettingsUseCaseImpl } from "~/api/features/getSettings/FrontendGetSettingsUseCase.js";
import {
    FrontendUpdateSettingsUseCase,
    FrontendUpdateSettingsRepository
} from "~/api/features/updateSettings/abstractions.js";
import { FrontendUpdateSettingsUseCase as UpdateSettingsUseCaseImpl } from "~/api/features/updateSettings/FrontendUpdateSettingsUseCase.js";

/*
 * `getPermission()` is async. Checking its result without awaiting it tests a Promise, which is
 * always truthy, so every signed-in user passed. These tests pin the awaited behavior: a denied
 * or failed lookup must never reach the repository.
 */
type Lookup = "allowed" | "denied" | "rejected";

const createIdentityContext = (params: { anonymous?: boolean; lookup: Lookup }) => {
    const getPermission = vi.fn(async () => {
        if (params.lookup === "rejected") {
            throw new Error("Permission lookup failed.");
        }
        return params.lookup === "allowed" ? { name: "dev-tools.frontend-settings.*" } : null;
    });

    return {
        getIdentity: () => ({ isAnonymous: () => params.anonymous === true }),
        getPermission
    };
};

const setup = (params: { anonymous?: boolean; lookup: Lookup }) => {
    const container = new Container();

    const getRepository = { execute: vi.fn().mockResolvedValue({ domain: "https://site.com" }) };
    const updateRepository = { execute: vi.fn().mockResolvedValue(true) };

    container.registerInstance(IdentityContext, createIdentityContext(params) as any);
    container.registerInstance(FrontendGetSettingsRepository, getRepository);
    container.registerInstance(FrontendUpdateSettingsRepository, updateRepository);
    container.register(GetSettingsUseCaseImpl);
    container.register(UpdateSettingsUseCaseImpl);

    return {
        getSettings: container.resolve(FrontendGetSettingsUseCase),
        updateSettings: container.resolve(FrontendUpdateSettingsUseCase),
        getRepository,
        updateRepository
    };
};

describe("Frontend settings authorization", () => {
    it("reads and updates settings when the permission is granted", async () => {
        const { getSettings, updateSettings, getRepository, updateRepository } = setup({
            lookup: "allowed"
        });

        const read = await getSettings.execute();
        expect(read.isOk()).toBe(true);
        expect(read.value).toEqual({ domain: "https://site.com" });

        const update = await updateSettings.execute({ domain: "https://new.com" });
        expect(update.isOk()).toBe(true);

        expect(getRepository.execute).toHaveBeenCalledTimes(1);
        expect(updateRepository.execute).toHaveBeenCalledWith({ domain: "https://new.com" });
    });

    it("denies a caller without the permission before touching the repository", async () => {
        const { getSettings, updateSettings, getRepository, updateRepository } = setup({
            lookup: "denied"
        });

        const read = await getSettings.execute();
        expect(read.isFail()).toBe(true);
        expect(read.error).toBeInstanceOf(NotAuthorizedError);

        const update = await updateSettings.execute({ domain: "https://evil.com" });
        expect(update.isFail()).toBe(true);
        expect(update.error).toBeInstanceOf(NotAuthorizedError);

        expect(getRepository.execute).not.toHaveBeenCalled();
        expect(updateRepository.execute).not.toHaveBeenCalled();
    });

    it("denies an anonymous caller", async () => {
        const { getSettings, updateSettings, getRepository, updateRepository } = setup({
            anonymous: true,
            lookup: "allowed"
        });

        expect((await getSettings.execute()).isFail()).toBe(true);
        expect((await updateSettings.execute({ domain: "https://evil.com" })).isFail()).toBe(true);

        expect(getRepository.execute).not.toHaveBeenCalled();
        expect(updateRepository.execute).not.toHaveBeenCalled();
    });

    it("does not touch the repository when the permission lookup fails", async () => {
        const { getSettings, updateSettings, getRepository, updateRepository } = setup({
            lookup: "rejected"
        });

        await expect(getSettings.execute()).rejects.toThrow("Permission lookup failed.");
        await expect(updateSettings.execute({ domain: "https://evil.com" })).rejects.toThrow(
            "Permission lookup failed."
        );

        expect(getRepository.execute).not.toHaveBeenCalled();
        expect(updateRepository.execute).not.toHaveBeenCalled();
    });
});
