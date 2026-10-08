import { describe, expect, it } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { GenerateRemoteComponentUseCase as GenerateAbstraction } from "~/api/features/generateComponent/abstractions.js";
import { GenerateRemoteComponentUseCase } from "~/api/features/generateComponent/GenerateRemoteComponentUseCase.js";
import { RefineRemoteComponentUseCase as RefineAbstraction } from "~/api/features/refineComponent/abstractions.js";
import { RefineRemoteComponentUseCase } from "~/api/features/refineComponent/RefineRemoteComponentUseCase.js";
import { buildComponentPrompt } from "~/api/features/generateComponent/buildComponentPrompt.js";
import { buildRefinePrompt } from "~/api/features/refineComponent/buildRefinePrompt.js";
import { MAX_OUTPUT_TOKENS } from "./promptCaching.js";

const GENERATED = [
    "---",
    "name: Custom/Hero",
    "label: Hero",
    "---",
    "```jsx",
    "export default function Hero() { return null; }",
    "export const manifest = { name: 'Custom/Hero', label: 'Hero', inputs: [] };",
    "```",
    "```css",
    ".hero {}",
    "```"
].join("\n");

const setup = () => {
    const calls: Ai.GenerateTextParams[] = [];
    const container = new Container();
    container.registerInstance(Ai, {
        generateText: async (params: Ai.GenerateTextParams) => {
            calls.push(params);
            return { text: GENERATED, steps: [] } as never;
        }
    } as unknown as Ai.Interface);
    container.registerInstance(GetFileContentsByIdUseCase, {
        execute: async () => Result.fail(new Error("no files in this test"))
    } as unknown as GetFileContentsByIdUseCase.Interface);
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () => Result.ok({ model: "claude-opus-5-5", connection: {} })
    } as unknown as ResolveAiCapabilityUseCase.Interface);
    container.register(GenerateRemoteComponentUseCase);
    container.register(RefineRemoteComponentUseCase);
    return { container, calls };
};

const systemMessageOf = (params: Ai.GenerateTextParams) =>
    params.system as { role: string; content: string; providerOptions: Record<string, unknown> };

describe("prompt caching", () => {
    it("sends the generation system prompt as a cacheable message, identical across calls", async () => {
        const { container, calls } = setup();
        const generate = container.resolve(GenerateAbstraction);

        await generate.execute({ prompt: "Build a hero for site A", name: "Hero A" });
        await generate.execute({ prompt: "Build a footer for site B", name: "Footer B" });

        expect(calls).toHaveLength(2);
        const [first, second] = calls.map(systemMessageOf);
        expect(first.role).toBe("system");
        expect(first.content).toBe(buildComponentPrompt());
        expect(second.content).toBe(first.content);
        expect(first.providerOptions).toEqual({
            anthropic: { cacheControl: { type: "ephemeral" } }
        });
        expect(calls[0].providerOptions).toEqual({
            openai: { promptCacheKey: "wbGenerateComponent.generate" }
        });
    });

    it("keeps everything that varies out of the system prompt", async () => {
        const { container, calls } = setup();
        await container
            .resolve(GenerateAbstraction)
            .execute({ prompt: "UNIQUE-PROMPT-TEXT", name: "UNIQUE-NAME" });

        const system = systemMessageOf(calls[0]).content;
        expect(system).not.toContain("UNIQUE-PROMPT-TEXT");
        expect(system).not.toContain("UNIQUE-NAME");
        expect(JSON.stringify(calls[0].messages)).toContain("UNIQUE-PROMPT-TEXT");
    });

    it("sends the refinement system prompt the same way", async () => {
        const { container, calls } = setup();
        const refine = container.resolve(RefineAbstraction);

        await refine.execute({ currentSource: "a", currentCss: "", feedback: "make it blue" });
        await refine.execute({ currentSource: "b", currentCss: "", feedback: "make it red" });

        const [first, second] = calls.map(systemMessageOf);
        expect(first.content).toBe(buildRefinePrompt());
        expect(second.content).toBe(first.content);
        expect(first.providerOptions).toEqual({
            anthropic: { cacheControl: { type: "ephemeral" } }
        });
        expect(calls[0].providerOptions).toEqual({
            openai: { promptCacheKey: "wbGenerateComponent.refine" }
        });
    });

    it("builds a byte-identical system prompt every time", () => {
        expect(buildComponentPrompt()).toBe(buildComponentPrompt());
        expect(buildRefinePrompt()).toBe(buildRefinePrompt());
    });

    it("caps output and passes the caller's abort signal to every model call", async () => {
        const { container, calls } = setup();
        const controller = new AbortController();
        await container
            .resolve(GenerateAbstraction)
            .execute({ prompt: "p", abortSignal: controller.signal });
        await container.resolve(RefineAbstraction).execute({
            currentSource: "a",
            currentCss: "",
            feedback: "f",
            abortSignal: controller.signal
        });
        for (const call of calls) {
            expect(call.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
            expect(call.abortSignal).toBe(controller.signal);
        }
    });
});
