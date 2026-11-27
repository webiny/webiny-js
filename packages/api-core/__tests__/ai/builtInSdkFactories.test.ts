import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { generateText } from "ai";
import { Container } from "@webiny/di";
import { AiSdkFactory } from "~/features/ai/abstractions.js";
import { AnthropicSdkFactory } from "~/features/ai/AnthropicSdkFactory.js";
import { GoogleSdkFactory } from "~/features/ai/GoogleSdkFactory.js";
import { OpenAiSdkFactory } from "~/features/ai/OpenAiSdkFactory.js";
import { OpenRouterSdkFactory } from "~/features/ai/OpenRouterSdkFactory.js";

const resolveFactory = (implementation: Parameters<Container["register"]>[0]) => {
    const container = new Container();
    container.register(implementation);
    return container.resolve(AiSdkFactory);
};

/*
 * Every variable a built-in factory or its provider SDK could read a key or an endpoint from.
 * None of them may affect AI Power-Ups, which takes both from the connection only.
 */
const stubProviderEnv = () => {
    vi.stubEnv("WEBINY_API_ANTHROPIC_API_KEY", "env-key");
    vi.stubEnv("WEBINY_API_OPENAI_API_KEY", "env-key");
    vi.stubEnv("WEBINY_API_GOOGLE_API_KEY", "env-key");
    vi.stubEnv("WEBINY_API_OPENROUTER_API_KEY", "env-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "env-key");
    vi.stubEnv("OPENAI_API_KEY", "env-key");
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "env-key");
    vi.stubEnv("OPENROUTER_API_KEY", "env-key");
    vi.stubEnv("ANTHROPIC_BASE_URL", "https://env-gateway.example.com/v1");
    vi.stubEnv("OPENAI_BASE_URL", "https://env-gateway.example.com/v1");
};

// Records where a request would have gone, then fails it so nothing leaves the process.
const captureRequest = () => {
    const requests: { url: string; headers: Record<string, string> }[] = [];
    vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        const headerEntries = headers.entries();
        requests.push({
            url: String(url),
            headers: Object.fromEntries(headerEntries)
        });
        throw new Error("request captured");
    });
    return requests;
};

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("built-in AI SDK factories", () => {
    it.each([
        ["Anthropic", AnthropicSdkFactory],
        ["OpenAI", OpenAiSdkFactory],
        ["Google", GoogleSdkFactory],
        ["OpenRouter", OpenRouterSdkFactory]
    ])("%s does not fall back to an API key from the environment", async (name, implementation) => {
        stubProviderEnv();
        const factory = resolveFactory(implementation);

        await expect(factory.execute()).rejects.toThrow(
            `No API key for ${name}. Pass one on the connection.`
        );
    });

    it.each([
        ["Anthropic", AnthropicSdkFactory, "claude-sonnet-5", "https://api.anthropic.com/v1/"],
        ["OpenAI", OpenAiSdkFactory, "gpt-5.4", "https://api.openai.com/v1/"]
    ])(
        "%s sends the connection's key to the vendor, ignoring *_BASE_URL",
        async (_, implementation, modelId, expectedUrlPrefix) => {
            stubProviderEnv();
            const requests = captureRequest();
            const sdk = await resolveFactory(implementation).execute("connection-key");

            const model = sdk.languageModel(modelId);

            await expect(generateText({ model, prompt: "hi", maxRetries: 0 })).rejects.toThrow();

            expect(requests).toHaveLength(1);
            expect(requests[0].url.startsWith(expectedUrlPrefix)).toBe(true);
            const sentHeaders = JSON.stringify(requests[0].headers);
            expect(sentHeaders).toContain("connection-key");
            expect(sentHeaders).not.toContain("env-key");
        }
    );
});
