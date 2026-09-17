import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Ai, AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AiChatConfig, AiChatResolver, AiChatUseCase } from "~/api/abstractions.js";
import { AiChatUseCase as AiChatUseCaseImplementation } from "~/api/AiChatUseCase.js";
import { SYSTEM_PROMPT } from "~/api/systemPrompt.js";

const RESOLVED_PROMPT = `${SYSTEM_PROMPT}\n\n### Project instructions\n\nAlways answer in Welsh.`;

/** Nothing to stream; the test only cares about what was handed to `streamText`. */
const emptyStream = {
    fullStream: (async function* () {})(),
    response: Promise.resolve({ messages: [] })
};

const setup = () => {
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

    container.registerInstance(AiChatResolver, {
        resolve: async () => ({
            model: "anthropic/claude-sonnet-4-5",
            connection: { sdkName: "anthropic", apiKey: "sk-test" },
            systemPrompt: RESOLVED_PROMPT
        })
    } as AiChatResolver.Interface);

    container.register(AiChatUseCaseImplementation);

    return { useCase: container.resolve(AiChatUseCase), requests };
};

const run = async (useCase: AiChatUseCase.Interface) => {
    const events = useCase.stream({
        messages: [{ role: "user", content: "which products are on sale?" }],
        decisions: []
    });

    for await (const _ of events) {
        // Drain it. `stream` is a generator, so nothing runs until something pulls.
    }
};

describe("AiChatUseCase", () => {
    /*
     * The resolver's tests assert what `resolve()` returns. This asserts the use case actually USES
     * it: reverting `system` to the imported `SYSTEM_PROMPT` would leave every other test green
     * while silently dropping a project's additional instructions.
     */
    it("sends the resolved prompt, not the one it imports", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests).toHaveLength(1);
        expect(requests[0].system).toBe(RESOLVED_PROMPT);
        expect(requests[0].system).not.toBe(SYSTEM_PROMPT);
    });

    it("sends the resolved model and connection", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].model).toBe("anthropic/claude-sonnet-4-5");
        expect(requests[0].connection).toEqual({ sdkName: "anthropic", apiKey: "sk-test" });
    });

    it("caps the agent loop at the configured step count", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].stopWhen).toBeDefined();
    });
});
