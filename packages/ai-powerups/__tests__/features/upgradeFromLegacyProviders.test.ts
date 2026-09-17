import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { Masker } from "@webiny/api-core/features/masker/index.js";
import ConnectionsHandler from "~/api/features/Connections/ConnectionsHandler.js";
import ModelRolesHandler from "~/api/features/ModelRoles/ModelRolesHandler.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import {
    AiCapability,
    ResolveAiCapabilityUseCase
} from "~/api/features/Capabilities/abstractions.js";
import { ResolveAiCapabilityUseCaseImplementation } from "~/api/features/Capabilities/ResolveAiCapabilityUseCase.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

/**
 * The upgrade path, end to end, for a project that already used AI Power-Ups.
 *
 * The individual handlers are covered elsewhere. What is only true when they are put together is
 * that a project which upgrades and *never opens the settings screen* keeps working: `ModelRoles`
 * seeds `standard` from the legacy `providers` section, `Connections` derives a connection from the
 * same section, and the role's `connectionId` has to name the connection the other handler
 * produced. Nothing but this test holds those two ids together, and if they drift apart every AI
 * feature fails at once with "connection no longer exists" on a blob nobody touched.
 */

const LEGACY_MODEL = "anthropic/claude-sonnet-4-5";

/** A settings blob written before `connections` or `modelRoles` existed. */
const legacyRaw = {
    providers: {
        presets: [
            {
                id: "prov-1",
                name: "Anthropic",
                model: LEGACY_MODEL,
                apiKeyEncrypted: "enc(sk-ant-real)",
                apiKeyMasked: "sk-a…al"
            }
        ]
    }
};

class StubEncryption implements Encryption.Interface {
    async encrypt(plain: string) {
        return `enc(${plain})`;
    }
    async decrypt(encrypted: string) {
        return encrypted.replace(/^enc\((.*)\)$/, "$1");
    }
}

class StubMasker implements Masker.Interface {
    mask(value: string) {
        return `${value.slice(0, 4)}…${value.slice(-2)}`;
    }
}

class ImageCapability implements AiCapability.Interface {
    readonly id = "test.readsImages";
    readonly label = "Reads images";
    readonly description = "Declares vision, which an upgraded project has never filled in.";
    readonly defaultRole = "vision" as const;
    readonly guidance = "Webiny guidance.";
}

class WritingCapability implements AiCapability.Interface {
    readonly id = "test.writes";
    readonly label = "Writes";
    readonly description = "For tests.";
    readonly defaultRole = "standard" as const;
    readonly guidance = "Webiny guidance.";
}

/**
 * Reads the legacy blob the way the repositories do: each handler gets its own slot plus the whole
 * blob, and here the slot is always `undefined` because neither section has ever been saved.
 */
function readSettings(): IAiPowerUpsSettings {
    const container = new Container();
    container.register(
        Encryption.createImplementation({ implementation: StubEncryption, dependencies: [] })
    );
    container.register(
        Masker.createImplementation({ implementation: StubMasker, dependencies: [] })
    );
    container.register(ConnectionsHandler);
    container.register(ModelRolesHandler);

    const handlers = container.resolveAll(AiPowerUpsSettingsGroupHandler);
    const result: Record<string, unknown> = {};
    for (const handler of handlers) {
        result[handler.name] = handler.mapFromStorage(
            (legacyRaw as Record<string, unknown>)[handler.name],
            legacyRaw
        );
    }

    return result as unknown as IAiPowerUpsSettings;
}

function resolver(value: IAiPowerUpsSettings) {
    const container = new Container();

    class StubGetSettings implements GetSettingsUseCase.Interface {
        async execute() {
            return Result.ok(value);
        }
    }

    container.register(
        AiCapability.createImplementation({ implementation: ImageCapability, dependencies: [] })
    );
    container.register(
        AiCapability.createImplementation({ implementation: WritingCapability, dependencies: [] })
    );
    container.register(
        GetSettingsUseCase.createImplementation({
            implementation: StubGetSettings,
            dependencies: []
        })
    );
    container.register(
        Encryption.createImplementation({ implementation: StubEncryption, dependencies: [] })
    );
    container.register(ResolveAiCapabilityUseCaseImplementation);

    return container.resolve(ResolveAiCapabilityUseCase);
}

describe("upgrading a project that already used AI Power-Ups", () => {
    it("resolves a capability from the legacy section with nothing saved", async () => {
        const result = await resolver(readSettings()).execute("test.writes");

        expect(result.isOk()).toBe(true);
        expect(result.value.model).toBe(LEGACY_MODEL);
        expect(result.value.connection.apiKey).toBe("sk-ant-real");
    });

    /*
     * The two handlers agree on the preset id by convention, not by anything the compiler checks:
     * `ModelRoles` writes `connectionId: legacy.id` and `Connections` writes `id: p.id`, in
     * different files with no shared constant.
     */
    it("points the seeded role at the connection the other handler derived", () => {
        const settings = readSettings();

        expect(settings.modelRoles.roles.standard.connectionId).toBe(
            settings.connections.presets[0].id
        );
    });

    /*
     * Image work used to read `providers.presets[0]` like everything else, so it has to keep
     * running on that model rather than failing because nobody has filled `vision` in.
     */
    it("keeps image work running on the legacy model via the standard fallback", async () => {
        const result = await resolver(readSettings()).execute("test.readsImages");

        expect(result.isOk()).toBe(true);
        expect(result.value.model).toBe(LEGACY_MODEL);
        expect(result.value.fellBackToStandard).toBe(true);
    });

    /*
     * The upgraded project is reading a section that does not exist yet, so nothing is written back
     * until someone saves. An empty `fast` is the honest state: the screen shows the fallback rather
     * than pretending a person chose this model for cheap work.
     */
    it("leaves the roles nobody has chosen empty", () => {
        const { roles } = readSettings().modelRoles;

        expect(roles.fast).toEqual({ connectionId: "", model: "" });
        expect(roles.vision).toEqual({ connectionId: "", model: "" });
    });
});
