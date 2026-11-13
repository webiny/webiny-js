import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai, AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { ListTagsUseCase } from "@webiny/api-file-manager/features/file/ListTags/index.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiPromptContextBuilder } from "~/api/features/AiPromptContext/index.js";
import { WbGeneratePageContentUseCase } from "~/api/features/WbGeneratePageContent/abstractions.js";
import { WbGeneratePageContentUseCaseImplementation } from "~/api/features/WbGeneratePageContent/WbGeneratePageContentUseCase.js";
import { WB_GENERATE_PAGE_CAPABILITY } from "~/api/features/WbGeneratePageContent/capability.js";

const setup = () => {
    const toolSetRequests: (AiSdkTools.Options | undefined)[] = [];
    const container = new Container();

    container.registerInstance(AiSdkTools, {
        getToolSet: (options?: AiSdkTools.Options) => {
            toolSetRequests.push(options);
            return {};
        }
    });

    container.registerInstance(Ai, {
        generateText: async () => ({ text: "[]", steps: [] })
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

    return { useCase: container.resolve(WbGeneratePageContentUseCase), toolSetRequests };
};

describe("WbGeneratePageContentUseCase", () => {
    it("asks for the read-only tools only, since nobody is there to approve a change", async () => {
        const { useCase, toolSetRequests } = setup();

        const result = await useCase.execute({
            prompt: "a landing page for a bakery",
            components: [{ name: "Heading" }],
            tools: []
        });

        expect(result.isOk()).toBe(true);
        expect(toolSetRequests).toEqual([{ readOnly: true }]);
    });
});
