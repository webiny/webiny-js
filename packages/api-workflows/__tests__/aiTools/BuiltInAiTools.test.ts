import { describe, expect, it } from "vitest";
import zod from "zod";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { isWorkflowAiToolName } from "~/domain/aiTools/isWorkflowAiToolName.js";
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { READ_TARGET_TOOL_NAME } from "~/features/aiTools/constants.js";
import { UPDATE_TARGET_FIELDS_TOOL_NAME } from "~/features/aiTools/constants.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";

const customInputSchema = zod.object({});

/**
 * The override is a class registration like the built-ins: `registerInstance` registrations
 * resolve before class registrations, so an instance would never be "the last registration".
 */
class CustomReadTool implements WorkflowAiTool.Interface {
    public readonly name = "readTarget";
    public readonly title = "Custom read";
    public readonly description = "A replacement.";
    public readonly inputSchema = customInputSchema;

    public async execute(): Promise<WorkflowAiTool.Result> {
        return { ok: true };
    }
}

const CustomReadToolImplementation = WorkflowAiTool.createImplementation({
    implementation: CustomReadTool,
    dependencies: []
});

describe("built-in AI tools (R173)", () => {
    it("registers exactly readTarget and updateTargetFields", async () => {
        const { context } = await createContextHandler();

        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(BUILT_IN_AI_TOOL_NAMES).toEqual(["readTarget", "updateTargetFields"]);
        expect(registry.list().map(tool => tool.name)).toEqual([
            "readTarget",
            "updateTargetFields"
        ]);
        expect(context.container.resolveAll(WorkflowAiTool)).toHaveLength(2);
    });

    it("gives both a valid provider tool name, a title and a description for the model", async () => {
        const { context } = await createContextHandler();

        const tools = context.container.resolve(WorkflowAiToolRegistryService).list();

        for (const tool of tools) {
            expect(isWorkflowAiToolName(tool.name)).toBe(true);
            expect(tool.title.length).toBeGreaterThan(0);
            expect(tool.description.length).toBeGreaterThan(0);
        }
        expect(tools.map(tool => tool.title)).toEqual(["Read target", "Update target fields"]);
    });

    it("declares changesContent: false on readTarget and true on updateTargetFields (R283)", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        const readTarget = registry.get(READ_TARGET_TOOL_NAME);
        const updateTargetFields = registry.get(UPDATE_TARGET_FIELDS_TOOL_NAME);

        expect(readTarget?.changesContent).toBe(false);
        expect(updateTargetFields?.changesContent).toBe(true);
    });

    it("keeps a custom tool next to them and lets it replace one by name (A61)", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                container.register(CustomReadToolImplementation);
            }
        });

        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(registry.get("readTarget")?.title).toBe("Custom read");
        expect(registry.get("updateTargetFields")?.title).toBe("Update target fields");
        expect(registry.list().map(tool => tool.name)).toEqual([
            "readTarget",
            "updateTargetFields"
        ]);
    });
});
