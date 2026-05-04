import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import {
    GetSettingsUseCase as UseCaseAbstraction,
    GetSettingsRepository as RepositoryAbstraction,
    GetSettingsGateway as GatewayAbstraction,
    SaveSettingsGateway as SaveGatewayAbstraction,
    type IGetSettingsGateway,
    type ISaveSettingsGateway
} from "./abstractions.js";
import { GetSettingsUseCase } from "./GetSettingsUseCase.js";
import { GetSettingsRepository } from "./GetSettingsRepository.js";
import type { FmSettings } from "../shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSettings(overrides?: Partial<FmSettings>): FmSettings {
    return {
        uploadMinFileSize: "0",
        uploadMaxFileSize: "26214400",
        srcPrefix: "https://cdn.example.com/files/",
        ...overrides
    };
}

type MockGateway = IGetSettingsGateway & { execute: ReturnType<typeof vi.fn> };

function createMockGateway(settings: FmSettings = createSettings()): MockGateway {
    const execute = vi.fn<() => Promise<FmSettings>>();
    execute.mockResolvedValue(settings);
    return { execute };
}

type MockSaveGateway = ISaveSettingsGateway & { execute: ReturnType<typeof vi.fn> };

function createMockSaveGateway(): MockSaveGateway {
    const execute = vi.fn<(data: FmSettings) => Promise<FmSettings>>();
    execute.mockImplementation(async (data: FmSettings) => data);
    return { execute };
}

function createContainer(mockGateway: MockGateway) {
    const container = new Container();

    // Register the mock gateway instances.
    container.registerInstance(GatewayAbstraction, mockGateway);
    container.registerInstance(SaveGatewayAbstraction, createMockSaveGateway());

    // Register the real repository and use case.
    container.register(GetSettingsRepository).inSingletonScope();
    container.register(GetSettingsUseCase);

    return container;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GetSettings Feature", () => {
    let mockGateway: MockGateway;
    let container: Container;

    beforeEach(() => {
        mockGateway = createMockGateway();
        container = createContainer(mockGateway);
    });

    // -----------------------------------------------------------------------
    // UseCase invokes gateway.
    // -----------------------------------------------------------------------

    it("should call gateway to retrieve settings", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute();

        expect(mockGateway.execute).toHaveBeenCalledTimes(1);
    });

    // -----------------------------------------------------------------------
    // UseCase returns settings.
    // -----------------------------------------------------------------------

    it("should return settings from the gateway", async () => {
        const settings = createSettings({ srcPrefix: "https://custom.cdn/files/" });
        mockGateway.execute.mockResolvedValue(settings);

        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute();

        expect(result).toEqual(settings);
    });

    // -----------------------------------------------------------------------
    // Repository caches settings as MobX observable state.
    // -----------------------------------------------------------------------

    it("should cache settings in the repository after fetch", async () => {
        const settings = createSettings();
        mockGateway.execute.mockResolvedValue(settings);

        const repository = container.resolve(RepositoryAbstraction);

        // Initially null.
        expect(repository.settings).toBeNull();

        await repository.execute();

        // Settings should be cached.
        expect(repository.settings).toEqual(settings);
    });

    // -----------------------------------------------------------------------
    // Repository updates cached settings on subsequent calls.
    // -----------------------------------------------------------------------

    it("should update cached settings on subsequent fetches", async () => {
        const initial = createSettings({ uploadMaxFileSize: "26214400" });
        const updated = createSettings({ uploadMaxFileSize: "52428800" });

        mockGateway.execute.mockResolvedValueOnce(initial).mockResolvedValueOnce(updated);

        const repository = container.resolve(RepositoryAbstraction);

        // First fetch.
        await repository.execute();
        expect(repository.settings).toEqual(initial);

        // Second fetch.
        await repository.execute();
        expect(repository.settings).toEqual(updated);
    });

    // -----------------------------------------------------------------------
    // Gateway error propagation.
    // -----------------------------------------------------------------------

    it("should propagate gateway errors", async () => {
        mockGateway.execute.mockRejectedValue(new Error("Network error"));

        const useCase = container.resolve(UseCaseAbstraction);

        await expect(useCase.execute()).rejects.toThrow("Network error");
    });

    // -----------------------------------------------------------------------
    // Repository settings remain null on error.
    // -----------------------------------------------------------------------

    it("should not update cached settings when gateway throws", async () => {
        mockGateway.execute.mockRejectedValue(new Error("Server error"));

        const repository = container.resolve(RepositoryAbstraction);

        await expect(repository.execute()).rejects.toThrow("Server error");

        // Settings should remain null.
        expect(repository.settings).toBeNull();
    });
});
