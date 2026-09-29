import { describe, it, expect } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { REMOTE_COMPONENT_CAPABILITY } from "~/api/capability.js";
import { GenerateRemoteComponentUseCase } from "~/api/features/generateComponent/abstractions.js";
import { GenerateRemoteComponentUseCase as GenerateImplementation } from "~/api/features/generateComponent/GenerateRemoteComponentUseCase.js";
import { buildComponentPrompt } from "~/api/features/generateComponent/buildComponentPrompt.js";
import { RefineRemoteComponentUseCase } from "~/api/features/refineComponent/abstractions.js";
import { RefineRemoteComponentUseCase as RefineImplementation } from "~/api/features/refineComponent/RefineRemoteComponentUseCase.js";
import { buildRefinePrompt } from "~/api/features/refineComponent/buildRefinePrompt.js";

const ADDITIONAL = "Always use the brand's orange for primary buttons.";

/*
 * A response `parseGeneratedSource` accepts. A fake returning anything less would make the use
 * case fail after the request was sent, and every assertion about the request would still pass,
 * which is a false green. The `toBe(true)` on `isOk()` below is there to catch exactly that.
 */
const RESPONSE = [
    "---",
    "name: Test/Banner",
    "label: Banner",
    "---",
    "```jsx",
    "export default function Banner() { return <div>Hi</div>; }",
    "```"
].join("\n");

interface SetupParams {
    resolution?: Result<never, Error>;
    /* False simulates AI Power-Ups being switched off, where the resolver is never registered. */
    withResolver?: boolean;
}

const setup = ({ resolution, withResolver = true }: SetupParams = {}) => {
    const requests: Ai.GenerateTextParams[] = [];
    const resolvedIds: string[] = [];
    const container = new Container();

    container.registerInstance(Ai, {
        generateText: async (request: Ai.GenerateTextParams) => {
            requests.push(request);
            return { text: RESPONSE, steps: [] };
        }
    } as unknown as Ai.Interface);

    container.registerInstance(GetFileContentsByIdUseCase, {
        execute: async () => Result.fail(new Error("not used in these tests"))
    } as unknown as GetFileContentsByIdUseCase.Interface);

    if (withResolver) {
        container.registerInstance(ResolveAiCapabilityUseCase, {
            execute: async (capabilityId: string) => {
                resolvedIds.push(capabilityId);
                return (
                    resolution ??
                    Result.ok({
                        capabilityId,
                        model: "anthropic/claude-sonnet-4-5",
                        connection: { sdkName: "anthropic", apiKey: "sk-test" },
                        roleId: "standard",
                        fellBackToStandard: false,
                        guidance: "",
                        additionalInstructions: ADDITIONAL
                    })
                );
            }
        } as unknown as ResolveAiCapabilityUseCase.Interface);
    }

    container.register(GenerateImplementation);
    container.register(RefineImplementation);

    return {
        generate: container.resolve(GenerateRemoteComponentUseCase),
        refine: container.resolve(RefineRemoteComponentUseCase),
        requests,
        resolvedIds
    };
};

describe("remote component generation", () => {
    it("asks for its model through the component capability", async () => {
        const { generate, requests, resolvedIds } = setup();

        const result = await generate.execute({ prompt: "a banner" });

        expect(result.isOk()).toBe(true);
        expect(resolvedIds).toEqual([REMOTE_COMPONENT_CAPABILITY]);
        expect(requests[0].model).toBe("anthropic/claude-sonnet-4-5");
        expect(requests[0].connection).toEqual({ sdkName: "anthropic", apiKey: "sk-test" });
    });

    /*
     * Reverting `system` to `buildComponentPrompt()` alone would keep the model test green while
     * silently dropping a project's instructions, so this checks the composed prompt directly.
     */
    it("appends the project's instructions to its own prompt", async () => {
        const { generate, requests } = setup();

        await generate.execute({ prompt: "a banner" });

        expect(requests[0].system).toContain(buildComponentPrompt());
        expect(requests[0].system).toContain(ADDITIONAL);
    });

    it("passes a resolver failure through, because it names the setting to fix", async () => {
        const error = new Error("Pick a model under Settings -> AI Power-Ups -> Model roles.");
        const { generate, requests } = setup({ resolution: Result.fail(error) });

        const result = await generate.execute({ prompt: "a banner" });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBe(error);
        expect(requests).toHaveLength(0);
    });

    it("says why when AI Power-Ups is not enabled", async () => {
        const { generate, requests } = setup({ withResolver: false });

        const result = await generate.execute({ prompt: "a banner" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("AI Power-Ups");
        expect(requests).toHaveLength(0);
    });
});

describe("remote component refinement", () => {
    it("uses the same capability as generation, with its own prompt", async () => {
        const { refine, requests, resolvedIds } = setup();

        const result = await refine.execute({
            currentSource: "export default () => null;",
            currentCss: "",
            feedback: "make it blue"
        });

        expect(result.isOk()).toBe(true);
        expect(resolvedIds).toEqual([REMOTE_COMPONENT_CAPABILITY]);
        expect(requests[0].model).toBe("anthropic/claude-sonnet-4-5");
        expect(requests[0].system).toContain(buildRefinePrompt());
        expect(requests[0].system).toContain(ADDITIONAL);
    });

    it("says why when AI Power-Ups is not enabled", async () => {
        const { refine } = setup({ withResolver: false });

        const result = await refine.execute({
            currentSource: "export default () => null;",
            currentCss: "",
            feedback: "make it blue"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toContain("AI Power-Ups");
    });
});
