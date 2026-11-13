import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai, AiSdkToolDefinition, AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { ListTagsUseCase } from "@webiny/api-file-manager/features/file/ListTags/index.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiPromptContextBuilder } from "~/api/features/AiPromptContext/index.js";
import { WbGeneratePageContentUseCase } from "~/api/features/WbGeneratePageContent/abstractions.js";
import { WbGeneratePageContentUseCaseImplementation } from "~/api/features/WbGeneratePageContent/WbGeneratePageContentUseCase.js";
import { WB_GENERATE_PAGE_CAPABILITY } from "~/api/features/WbGeneratePageContent/capability.js";

class NoopHandler {
    async execute() {
        return {};
    }
}

const definition = (
    name: string,
    annotations?: AiSdkToolDefinition.Annotations
): AiSdkToolDefinition.Interface => ({
    name,
    description: name,
    inputSchema: {} as AiSdkToolDefinition.Interface["inputSchema"],
    annotations,
    handler: NoopHandler
});

const setup = () => {
    const requests: Ai.GenerateTextParams[] = [];
    const container = new Container();
    const definitions = [
        definition("listPages", { readOnlyHint: true }),
        definition("deleteFolder", { readOnlyHint: false, destructiveHint: true }),
        definition("createEntry")
    ];

    for (const tool of definitions) {
        container.registerInstance(AiSdkToolDefinition, tool);
    }

    container.registerInstance(AiSdkTools, {
        getToolSet: () =>
            Object.fromEntries(
                definitions.map(tool => [tool.name, { description: tool.description }])
            )
    } as unknown as AiSdkTools.Interface);

    container.registerInstance(Ai, {
        generateText: async (request: Ai.GenerateTextParams) => {
            requests.push(request);
            return { text: "[]", steps: [] };
        }
    } as unknown as Ai.Interface);

    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () =>
            Result.ok({
                capabilityId: WB_GENERATE_PAGE_CAPABILITY,
                model: "anthropic/claude-sonnet-4-5",
                connection: { sdkName: "anthropic", apiKey: "sk-test" },
                roleId: "standard",
                fellBackToStandard: false,
                guidance: "",
                additionalInstructions: ""
            })
    } as unknown as ResolveAiCapabilityUseCase.Interface);

    container.registerInstance(AiPromptContextBuilder, {
        execute: async () => ({
            allProjectFiles: [],
            additionalFiles: [],
            excludedFileIds: new Set<string>(),
            cacheHit: false,
            warnings: [],
            toString: () => ""
        })
    });

    container.registerInstance(ListTagsUseCase, {
        execute: async () => Result.ok([])
    } as unknown as ListTagsUseCase.Interface);

    container.register(WbGeneratePageContentUseCaseImplementation);

    return { useCase: container.resolve(WbGeneratePageContentUseCase), requests };
};

describe("WbGeneratePageContentUseCase", () => {
    it("offers the model only the tools that do not change anything", async () => {
        const { useCase, requests } = setup();

        const result = await useCase.execute({
            prompt: "a landing page for a bakery",
            components: [{ name: "Heading" }],
            tools: []
        });

        expect(result.isOk()).toBe(true);
        expect(Object.keys(requests[0].tools ?? {})).toEqual(["listPages"]);
        expect(result.value.telemetry.toolsAvailable).toEqual(["listPages"]);
    });
});
