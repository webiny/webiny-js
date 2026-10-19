import { beforeEach, describe, expect, it } from "vitest";
import zod from "zod";
import type { Container } from "@webiny/feature/api";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID,
    testAutomationSettingsSchema
} from "~tests/__helpers/TestAutomationDefinition.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomationDefinitions/index.js";

const FIXED_MESSAGE = "The workflow could not be read or saved.";

const expectFixedFailure = (
    result: Awaited<ReturnType<ListAutomationDefinitionsUseCase.Interface["execute"]>>,
    rawText: string
) => {
    expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    expect(result.error.message).toBe(FIXED_MESSAGE);
    expect(
        JSON.stringify({ message: result.error.message, data: result.error.data })
    ).not.toContain(rawText);
    expect(loggedErrors).toHaveLength(1);
    expect((loggedErrors[0].fields.error as Error).message).toBe(rawText);
};

beforeEach(() => {
    loggedErrors.length = 0;
});

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

/** Registers a definition with the given id, name and settings schema. */
const registerDefinition = (
    id: string,
    name: string,
    settingsSchema: zod.ZodType,
    models: string[] = ["*"]
) => {
    class DefinitionImpl implements AutomationDefinition.Interface {
        public readonly id = id;
        public readonly name = name;
        public readonly models = models;
        public readonly settingsSchema = settingsSchema;

        public async run(): Promise<AutomationDefinition.Outcome> {
            return { type: "approved" };
        }
    }
    const implementation = AutomationDefinition.createImplementation({
        implementation: DefinitionImpl,
        dependencies: []
    });
    return (container: Container): void => {
        container.register(implementation);
    };
};

const createListContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        listAutomations: context.container.resolve(ListAutomationDefinitionsUseCase)
    };
};

describe("ListAutomationDefinitionsUseCase (R138)", () => {
    it("lists nothing when no automation is defined", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        expect(expectOk(await listAutomations.execute())).toEqual([]);
    });

    it("lists the definitions with their models and settings as JSON schema", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTestAutomation(container, { models: ["cms.*"] });
            }
        });

        const rows = expectOk(await listAutomations.execute());

        expect(rows).toEqual([
            {
                id: TEST_AUTOMATION_ID,
                name: "Test automation",
                models: ["cms.*"],
                settingsSchema: zod.toJSONSchema(testAutomationSettingsSchema, {
                    io: "input",
                    unrepresentable: "any"
                })
            }
        ]);
        expect(rows[0].settingsSchema).toMatchObject({ type: "object" });
        expect(Object.keys((rows[0].settingsSchema.properties ?? {}) as object)).toEqual([
            "mode",
            "comment"
        ]);
    });

    it("does not require a field that has a default (input side of the schema)", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                registerTestAutomation(container);
            }
        });

        const rows = expectOk(await listAutomations.execute());

        // `mode` has `.default("approve")`: the author may leave it out.
        expect(rows[0].settingsSchema.required ?? []).not.toContain("mode");
    });

    it("returns the workflow persistence error when a schema cannot be converted (R87, R138)", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                registerDefinition("broken", "Broken", {} as never)(container);
            }
        });

        const result = await listAutomations.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe(FIXED_MESSAGE);
        expect(loggedErrors).toHaveLength(1);
    });

    it("sorts the rows by name", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                registerDefinition("zulu", "Zulu", zod.object({}))(container);
                registerDefinition("alpha", "Alpha", zod.object({}))(container);
                registerDefinition("mike", "Mike", zod.object({}))(container);
            }
        });

        const rows = expectOk(await listAutomations.execute());

        expect(rows.map(row => row.name)).toEqual(["Alpha", "Mike", "Zulu"]);
    });

    it("lists a definition whose schema JSON schema cannot represent (unrepresentable: any)", async () => {
        const { listAutomations } = await createListContext({
            setup: registerDefinition("dated", "Dated", zod.object({ at: zod.date() }))
        });

        const result = await listAutomations.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value?.[0].settingsSchema).toMatchObject({
            type: "object",
            properties: { at: {} }
        });
    });

    it("allows a full-access permission set", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows.*" }]
        });

        expect((await listAutomations.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listAutomations.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list automations" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listAutomations } = await createListContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listAutomations.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws (R87)", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listAutomations.execute();

        expectFixedFailure(result, "Permissions are down.");
    });
});
