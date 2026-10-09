import { Container } from "@webiny/di";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { Ai } from "~/features/ai/Ai.js";
import { Ai as AiAbstraction } from "~/features/ai/abstractions.js";
import { AiConnectionFactory } from "~/features/ai/abstractions.js";
import { AiModelRegistry } from "~/features/ai/abstractions.js";
import { AiSdkFactory } from "~/features/ai/abstractions.js";
import type { IAiSdk } from "~/features/ai/abstractions.js";
import { AiAfterStreamTextEvent, AiStreamTextErrorEvent } from "~/features/ai/events.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";

/*
 * A streamed call publishes the same after and error events a generated one does. Without them, a
 * consumer that records usage from those events (component extraction's model-call log) silently lost
 * every streamed call.
 */

const USAGE = {
    inputTokens: { total: 120, noCache: 20, cacheRead: 100, cacheWrite: undefined },
    outputTokens: { total: 45, text: 45, reasoning: undefined }
};

const streamingModel = () =>
    new MockLanguageModelV4({
        doStream: async () => ({
            stream: simulateReadableStream({
                chunks: [
                    { type: "text-start", id: "0" },
                    { type: "text-delta", id: "0", delta: "Hello" },
                    { type: "text-end", id: "0" },
                    {
                        type: "finish",
                        finishReason: { unified: "stop", raw: "end_turn" },
                        usage: USAGE
                    }
                ]
            })
        })
    });

const createAi = (languageModel: MockLanguageModelV4) => {
    const published: unknown[] = [];
    const container = new Container();
    container.registerInstance(AiSdkFactory, {
        id: "test",
        name: "Test",
        models: [],
        execute: async (): Promise<IAiSdk> => ({ languageModel: () => languageModel })
    });
    container.registerInstance(AiConnectionFactory, {
        execute: async () => ({ id: "test", sdkName: "test" })
    });
    container.registerInstance(EventPublisher, {
        publish: async (event: unknown) => {
            published.push(event);
        }
    } as any);
    container.registerInstance(AiModelRegistry, {
        listModels: async () => [
            { providerId: "test", providerName: "Test", modelId: "m", modelName: "m" } as any
        ]
    });
    container.register(Ai);
    return { ai: container.resolve(AiAbstraction), published };
};

describe("Ai streamText events", () => {
    it("publishes the after event with the call's usage once the stream is consumed", async () => {
        const { ai, published } = createAi(streamingModel());
        const stream = await ai.streamText({ model: "test/m", prompt: "hi" });
        for await (const _part of stream.fullStream) {
            // consumed as Generate consumes it
        }
        const after = published.filter(e => e instanceof AiAfterStreamTextEvent);
        expect(after).toHaveLength(1);
        const payload = (after[0] as AiAfterStreamTextEvent).payload;
        expect(payload.finishReason).toBe("stop");
        expect((payload.usage as { inputTokens: number; outputTokens: number }).outputTokens).toBe(
            45
        );
        expect((payload.usage as { inputTokens: number }).inputTokens).toBe(120);
        expect(published.some(e => e instanceof AiStreamTextErrorEvent)).toBe(false);
    });

    it("publishes the error event, not the after event, when the stream is aborted", async () => {
        const languageModel = new MockLanguageModelV4({
            // A provider that has written something when its request is aborted: the fetch errors with
            // the signal's reason, as a call cut off at its time limit does.
            doStream: async ({ abortSignal }) => ({
                stream: new ReadableStream({
                    start(controller) {
                        controller.enqueue({ type: "text-start", id: "0" });
                        controller.enqueue({ type: "text-delta", id: "0", delta: "partial" });
                        abortSignal?.addEventListener("abort", () =>
                            controller.error(abortSignal.reason)
                        );
                    }
                })
            })
        });
        const { ai, published } = createAi(languageModel);
        const controller = new AbortController();
        const stream = await ai.streamText({
            model: "test/m",
            prompt: "hi",
            abortSignal: controller.signal
        });
        setTimeout(() => controller.abort(new Error("timeout")), 20);
        const seen: string[] = [];
        try {
            for await (const part of stream.fullStream) {
                seen.push(part.type);
            }
        } catch (e) {
            seen.push("THROWN " + String(e));
        }
        // What Generate sees: the text written, then the abort thrown out of the stream.
        expect(seen).toContain("text-delta");
        expect(seen[seen.length - 1]).toContain("THROWN");
        expect(published.some(e => e instanceof AiStreamTextErrorEvent)).toBe(true);
        expect(published.some(e => e instanceof AiAfterStreamTextEvent)).toBe(false);
    });
});
