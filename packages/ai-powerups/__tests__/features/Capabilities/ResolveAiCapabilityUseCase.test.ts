import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { AiCapability } from "~/api/features/Capabilities/abstractions.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
import { ResolveAiCapabilityUseCaseImplementation } from "~/api/features/Capabilities/ResolveAiCapabilityUseCase.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

type Overrides = IAiPowerUpsSettings["capabilities"]["overrides"];
type Roles = IAiPowerUpsSettings["modelRoles"]["roles"];

const CHEAP = "anthropic/claude-haiku-4-5";
const MAIN = "anthropic/claude-sonnet-4-5";

const roles = (partial: Partial<Roles> = {}): Roles => ({
    fast: { connectionId: "", model: "" },
    standard: { connectionId: "conn-1", model: MAIN },
    vision: { connectionId: "", model: "" },
    ...partial
});

function settings(params: {
    roles?: Partial<Roles>;
    overrides?: Overrides;
    connections?: IAiPowerUpsSettings["connections"]["presets"];
}): IAiPowerUpsSettings {
    return {
        connections: {
            presets: params.connections ?? [
                {
                    id: "conn-1",
                    name: "Anthropic (prod)",
                    sdkName: "anthropic",
                    apiKeyMasked: "sk-ant-1…9999",
                    apiKeyEncrypted: "encrypted-1"
                }
            ]
        },
        modelRoles: { roles: roles(params.roles) },
        capabilities: { overrides: params.overrides ?? {} }
    } as unknown as IAiPowerUpsSettings;
}

/** `standard` and `fast` differ, so which role answered is visible in the model alone. */
class TestCapability implements AiCapability.Interface {
    readonly id = "test.capability";
    readonly label = "Test capability";
    readonly description = "For tests.";
    readonly defaultRole = "standard" as const;
    readonly guidance = "Webiny guidance.";
}

class RolelessCapability implements AiCapability.Interface {
    readonly id = "test.noGuidance";
    readonly label = "No guidance";
    readonly description = "Prompt is assembled per request.";
    readonly defaultRole = "vision" as const;
}

class StubEncryption implements Encryption.Interface {
    async encrypt(plain: string) {
        return `encrypted-${plain}`;
    }
    /** Prefixed so a test can tell a decrypted key from the stored ciphertext. */
    async decrypt(encrypted: string) {
        return `decrypted:${encrypted}`;
    }
}

function resolver(value: IAiPowerUpsSettings) {
    const container = new Container();

    container.register(
        AiCapability.createImplementation({ implementation: TestCapability, dependencies: [] })
    );
    container.register(
        AiCapability.createImplementation({ implementation: RolelessCapability, dependencies: [] })
    );
    // Closes over `value`, so it has to be built per call rather than hoisted like the others.
    class StubGetSettings implements GetSettingsUseCase.Interface {
        async execute() {
            return Result.ok(value);
        }
    }

    container.register(
        GetSettingsUseCase.createImplementation({
            implementation: StubGetSettings,
            dependencies: []
        })
    );
    container.register(
        Encryption.createImplementation({
            implementation: StubEncryption,
            dependencies: []
        })
    );
    container.register(ResolveAiCapabilityUseCaseImplementation);

    return container.resolve(ResolveAiCapabilityUseCase);
}

describe("ResolveAiCapabilityUseCase", () => {
    it("uses the capability's default role", async () => {
        const result = await resolver(settings({})).execute("test.capability");

        expect(result.isOk()).toBe(true);
        expect(result.value.model).toBe(MAIN);
        expect(result.value.roleId).toBe("standard");
        expect(result.value.connection).toEqual({
            sdkName: "anthropic",
            apiKey: "decrypted:encrypted-1"
        });
    });

    it("decrypts the key rather than handing back what is stored", async () => {
        const result = await resolver(settings({})).execute("test.capability");

        expect(result.value.connection.apiKey).not.toBe("encrypted-1");
    });

    it("honours a role chosen for the capability", async () => {
        const result = await resolver(
            settings({
                roles: { fast: { connectionId: "conn-1", model: CHEAP } },
                overrides: { "test.capability": { roleId: "fast" } }
            })
        ).execute("test.capability");

        expect(result.value.model).toBe(CHEAP);
        expect(result.value.roleId).toBe("fast");
    });

    it("lets a pinned connection and model beat the role", async () => {
        const result = await resolver(
            settings({
                overrides: {
                    "test.capability": { roleId: "fast", connectionId: "conn-1", model: CHEAP }
                }
            })
        ).execute("test.capability");

        expect(result.value.model).toBe(CHEAP);
        expect(result.value.roleId).toBeNull();
    });

    it("ignores a half-finished pin, because guessing the other half is worse", async () => {
        const result = await resolver(
            settings({ overrides: { "test.capability": { model: CHEAP } } })
        ).execute("test.capability");

        expect(result.value.model).toBe(MAIN);
        expect(result.value.roleId).toBe("standard");
    });

    it("falls back to standard when the requested role is empty, and says so", async () => {
        // Reproduces an upgrade: migration fills only `standard`, so image work keeps running on
        // the model it ran on before rather than failing.
        const result = await resolver(settings({})).execute("test.noGuidance");

        expect(result.value.model).toBe(MAIN);
        expect(result.value.roleId).toBe("standard");
        expect(result.value.fellBackToStandard).toBe(true);
    });

    it("fails with a message naming the settings screen when nothing is configured", async () => {
        const result = await resolver(
            settings({ roles: { standard: { connectionId: "", model: "" } } })
        ).execute("test.capability");

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("Model roles");
    });

    it("fails when the role names a connection that has been deleted", async () => {
        const result = await resolver(settings({ connections: [] })).execute("test.capability");

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("no longer exists");
    });

    it("fails when the connection exists but has no key", async () => {
        const result = await resolver(
            settings({
                connections: [
                    {
                        id: "conn-1",
                        name: "Anthropic (prod)",
                        sdkName: "anthropic",
                        apiKeyMasked: "",
                        apiKeyEncrypted: ""
                    }
                ]
            })
        ).execute("test.capability");

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("no API key");
    });

    it("rejects a model paired with another vendor's credential", async () => {
        const result = await resolver(
            settings({ roles: { standard: { connectionId: "conn-1", model: "openai/gpt-5" } } })
        ).execute("test.capability");

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("cannot run on");
    });

    it("returns the capability's own guidance by default", async () => {
        const result = await resolver(settings({})).execute("test.capability");

        expect(result.value.guidance).toBe("Webiny guidance.");
        expect(result.value.additionalInstructions).toBe("");
    });

    it("keeps our guidance while the replace switch is off, even with text saved", async () => {
        const result = await resolver(
            settings({
                overrides: {
                    "test.capability": { guidance: "Their prompt.", replacePrompt: false }
                }
            })
        ).execute("test.capability");

        expect(result.value.guidance).toBe("Webiny guidance.");
    });

    it("uses their guidance once the replace switch is on", async () => {
        const result = await resolver(
            settings({
                overrides: {
                    "test.capability": { guidance: "Their prompt.", replacePrompt: true }
                }
            })
        ).execute("test.capability");

        expect(result.value.guidance).toBe("Their prompt.");
    });

    it("passes additional instructions through, trimmed", async () => {
        const result = await resolver(
            settings({
                overrides: { "test.capability": { additionalInstructions: "  Be brief.  " } }
            })
        ).execute("test.capability");

        expect(result.value.additionalInstructions).toBe("Be brief.");
    });

    it("fails loudly on an unregistered capability id", async () => {
        const result = await resolver(settings({})).execute("nope.notRegistered");

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("Unknown AI capability");
    });
});
