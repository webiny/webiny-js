import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiChatProvider } from "@webiny/ai-chat/api/index.js";
import { SYSTEM_PROMPT } from "@webiny/ai-chat/api/index.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import type { IResolvedAiCapability } from "~/api/features/Capabilities/index.js";
import { PowerUpsAiChatProvider } from "~/api/features/AiChatProvider/PowerUpsAiChatProvider.js";
import { AI_CHAT_CAPABILITY } from "~/api/features/AiChatProvider/capability.js";

const resolution = (partial: Partial<IResolvedAiCapability> = {}): IResolvedAiCapability => ({
    capabilityId: AI_CHAT_CAPABILITY,
    model: "anthropic/claude-sonnet-4-5",
    connection: { sdkName: "anthropic", apiKey: "sk-ant-decrypted" },
    roleId: "standard",
    fellBackToStandard: false,
    guidance: SYSTEM_PROMPT,
    additionalInstructions: "",
    ...partial
});

const setup = (result: Result<IResolvedAiCapability, Error>) => {
    const asked: string[] = [];
    const container = new Container();

    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async (capabilityId: string) => {
            asked.push(capabilityId);
            return result;
        }
    } as ResolveAiCapabilityUseCase.Interface);

    container.register(PowerUpsAiChatProvider);

    return { provider: container.resolve(AiChatProvider), asked };
};

describe("PowerUpsAiChatProvider", () => {
    it("resolves the assistant's own capability, not some other feature's", async () => {
        const { provider, asked } = setup(Result.ok(resolution()));

        await provider.resolve();

        expect(asked).toEqual([AI_CHAT_CAPABILITY]);
    });

    it("returns the capability's model and decrypted key", async () => {
        const { provider } = setup(Result.ok(resolution()));

        const resolved = await provider.resolve();

        expect(resolved.model).toBe("anthropic/claude-sonnet-4-5");
        expect(resolved.apiKey).toBe("sk-ant-decrypted");
    });

    it("ships the shipped prompt unchanged when the project added nothing", async () => {
        const { provider } = setup(Result.ok(resolution()));

        const resolved = await provider.resolve();

        expect(resolved.systemPrompt).toBe(SYSTEM_PROMPT);
    });

    it("appends the project's instructions rather than replacing the prompt", async () => {
        const { provider } = setup(
            Result.ok(resolution({ additionalInstructions: "Always answer in British English." }))
        );

        const resolved = await provider.resolve();

        // Both halves, ours first: an appended instruction must not cost the tool-discovery rules.
        expect(resolved.systemPrompt).toContain(SYSTEM_PROMPT);
        expect(resolved.systemPrompt).toContain("Always answer in British English.");
        expect(resolved.systemPrompt.indexOf(SYSTEM_PROMPT)).toBeLessThan(
            resolved.systemPrompt.indexOf("Always answer in British English.")
        );
    });

    it("throws the resolver's message, which names the setting to fix", async () => {
        const { provider } = setup(
            Result.fail(
                new Error(
                    'No model is configured for the "standard" role. Pick one under Settings → AI Power-Ups → Model roles.'
                )
            )
        );

        await expect(provider.resolve()).rejects.toThrow(
            "Pick one under Settings → AI Power-Ups → Model roles."
        );
    });
});
