import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    registerTestAiTool,
    TEST_AI_TOOL_NAME,
    testAiToolInputSchema
} from "~tests/__helpers/TestWorkflowAiTool.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createListContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        listAiTools: context.container.resolve(ListWorkflowAiToolsUseCase)
    };
};

describe("ListWorkflowAiToolsUseCase (R167, R176)", () => {
    it("lists nothing when no tool is registered", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        expect(expectOk(await listAiTools.execute())).toEqual([]);
    });

    it("lists name, title and description only, with no schema", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTestAiTool(container, {
                    title: "Test tool",
                    description: "A tool for tests."
                });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows).toEqual([
            { name: TEST_AI_TOOL_NAME, title: "Test tool", description: "A tool for tests." }
        ]);
        expect(Object.keys(rows[0])).toEqual(["name", "title", "description"]);
    });

    it("sorts the rows by title, then by name", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                registerTestAiTool(container, { name: "zulu", title: "Zulu" });
                registerTestAiTool(container, { name: "alphaTwo", title: "Alpha" });
                registerTestAiTool(container, { name: "mike", title: "Mike" });
                registerTestAiTool(container, { name: "alphaOne", title: "Alpha" });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows.map(row => row.name)).toEqual(["alphaOne", "alphaTwo", "mike", "zulu"]);
    });

    it("lists a replaced tool once, with the last registration's texts (A61)", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                registerTestAiTool(container, { title: "Original" });
                registerTestAiTool(container, { title: "Replacement" });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Replacement");
    });

    it("skips a tool with an invalid name without an error (R167, R87)", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: "my-tool", title: "Bad" });
                registerTestAiTool(container, { title: "Good" });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows.map(row => row.name)).toEqual([TEST_AI_TOOL_NAME]);
    });

    it("allows a full-access permission set", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows.*" }]
        });

        expect((await listAiTools.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.message).toBe("You are not allowed to list AI tools.");
        expect(result.error.data).toEqual({ action: "list AI tools" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listAiTools } = await createListContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listAiTools.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws (R87)", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
    });

    it("returns the workflow persistence error when the tool list throws (R87)", async () => {
        const { listAiTools } = await createListContext({
            setup: (container: Container) => {
                container.registerInstance(WorkflowAiToolRegistryService, {
                    get: () => null,
                    list: () => {
                        throw new Error("The tool list is down.");
                    }
                });
            }
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("The tool list is down.");
    });

    it("returns the workflow persistence error when a tool getter throws (R87)", async () => {
        class BrokenTool implements WorkflowAiTool.Interface {
            public readonly name = "brokenTool";
            public readonly description = "Broken.";
            public readonly inputSchema = testAiToolInputSchema;

            public get title(): string {
                throw new Error("The title is down.");
            }

            public async execute(): Promise<WorkflowAiTool.Result> {
                return { ok: true };
            }
        }
        const { listAiTools } = await createListContext({
            setup: container => {
                container.registerInstance(WorkflowAiTool, new BrokenTool());
            }
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("The title is down.");
    });
});
