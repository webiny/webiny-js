import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Ai, AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Result } from "@webiny/feature/api";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiChatConfig, AiChatUseCase } from "~/api/features/AiChat/abstractions.js";
import { AiChatUseCase as AiChatUseCaseImplementation } from "~/api/features/AiChat/AiChatUseCase.js";
import { AI_CHAT_CAPABILITY } from "~/api/features/AiChat/capability.js";
import { SYSTEM_PROMPT } from "~/api/features/AiChat/systemPrompt.js";
import type { AiChatEvent } from "~/api/features/AiChat/events.js";

const ADDITIONAL = "Always answer in Welsh.";

/** Nothing to stream; the test only cares about what was handed to `streamText`. */
const emptyStream = {
    fullStream: (async function* () {})(),
    response: Promise.resolve({ messages: [] })
};

const setup = (resolution?: Result<never, Error>) => {
    const requests: Ai.GenerateTextParams[] = [];
    const container = new Container();

    container.registerInstance(Ai, {
        streamText: async (request: Ai.StreamTextParams) => {
            requests.push(request as unknown as Ai.GenerateTextParams);
            return emptyStream;
        }
    } as unknown as Ai.Interface);

    container.registerInstance(AiSdkTools, { getToolSet: () => ({}) } as AiSdkTools.Interface);

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ isAnonymous: () => false })
    } as unknown as IdentityContext.Interface);

    container.registerInstance(AiChatConfig, { maxSteps: 12 });

    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () =>
            resolution ??
            Result.ok({
                capabilityId: AI_CHAT_CAPABILITY,
                model: "anthropic/claude-sonnet-4-5",
                connection: { sdkName: "anthropic", apiKey: "sk-test" },
                roleId: "standard",
                fellBackToStandard: false,
                guidance: SYSTEM_PROMPT,
                additionalInstructions: ADDITIONAL
            })
    } as unknown as ResolveAiCapabilityUseCase.Interface);

    container.register(AiChatUseCaseImplementation);

    return { useCase: container.resolve(AiChatUseCase), requests };
};

const run = async (useCase: AiChatUseCase.Interface) => {
    const events = useCase.stream({
        messages: [{ role: "user", content: "which products are on sale?" }],
        decisions: []
    });

    const seen: AiChatEvent[] = [];

    // `stream` is a generator, so nothing runs until something pulls.
    for await (const event of events) {
        seen.push(event);
    }

    return seen;
};

describe("AiChatUseCase", () => {
    /*
     * The resolver's tests assert what `resolve()` returns. This asserts the use case actually USES
     * it: reverting `system` to the imported `SYSTEM_PROMPT` would leave every other test green
     * while silently dropping a project's additional instructions.
     */
    it("sends the capability's composed prompt, not the one it imports", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests).toHaveLength(1);
        // Ours first, then the project's: an appended instruction must not cost the tool rules.
        expect(requests[0].system).toContain(SYSTEM_PROMPT);
        expect(requests[0].system).toContain(ADDITIONAL);
        expect(requests[0].system).not.toBe(SYSTEM_PROMPT);
    });

    it("sends the capability's model and connection", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].model).toBe("anthropic/claude-sonnet-4-5");
        expect(requests[0].connection).toEqual({ sdkName: "anthropic", apiKey: "sk-test" });
    });

    /*
     * The resolver's messages name the setting to fix ("Pick one under Settings → AI Power-Ups →
     * Model roles"). They have to reach the palette, and by the time this is iterating, the
     * transport has committed to a 200, so an event is the only way out.
     */
    it("reports an unresolvable capability as an error event, not a throw", async () => {
        const message = 'No model is configured for the "standard" role.';
        const { useCase, requests } = setup(
            Result.fail(new Error(message)) as Result<never, Error>
        );

        const events = await run(useCase);

        expect(events).toEqual([{ type: "error", message }]);
        expect(requests).toHaveLength(0);
    });

    it("caps the agent loop at the configured step count", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].stopWhen).toBeDefined();
    });
});
