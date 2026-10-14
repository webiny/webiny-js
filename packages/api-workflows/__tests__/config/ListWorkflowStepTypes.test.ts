import { describe, expect, it } from "vitest";
import zod from "zod";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";

/** Throws from the flag read. */
class ThrowingFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get(): ReturnType<FeatureFlags.Interface["get"]> {
        throw new Error("Flags are down.");
    }
}

/** Turns the `aiPowerups` flag on; every other flag answers as before. */
class AiPowerupsEnabledFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get() {
        const flags = this.decoratee.get();
        const isEnabled = flags.isEnabled.bind(flags);
        flags.isEnabled = name => name === "aiPowerups" || isEnabled(name);
        return flags;
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createStepTypesContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        listStepTypes: context.container.resolve(ListWorkflowStepTypesUseCase)
    };
};

describe("ListWorkflowStepTypesUseCase (D130, R98)", () => {
    it("lists review, AI and automation for an editor; AI is off without the flag", async () => {
        const { listStepTypes } = await createStepTypesContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes).toEqual([
            {
                type: "review",
                title: "Review",
                available: true,
                unavailableReason: null,
                configSchema: zod.toJSONSchema(reviewStepConfigSchema, {
                    io: "input",
                    unrepresentable: "any"
                })
            },
            {
                type: "ai",
                title: "AI",
                available: false,
                unavailableReason: "AI powerups are not enabled.",
                configSchema: null
            },
            {
                type: "automation",
                title: "Automation",
                available: false,
                unavailableReason: "No automation is defined.",
                configSchema: zod.toJSONSchema(automationStepConfigSchema, {
                    io: "input",
                    unrepresentable: "any"
                })
            }
        ]);
        expect(stepTypes[0].configSchema).toMatchObject({
            type: "object",
            required: ["teams", "assignment"]
        });
        expect(stepTypes[2].configSchema).toMatchObject({
            type: "object",
            required: ["automationId", "settings"]
        });
    });

    it("marks AI available when the aiPowerups flag is on", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: AiPowerupsEnabledFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes[1]).toEqual({
            type: "ai",
            title: "AI",
            available: true,
            unavailableReason: null,
            configSchema: null
        });
    });

    it("marks automation available once a definition is registered", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                registerTestAutomation(container);
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes[2]).toMatchObject({
            type: "automation",
            available: true,
            unavailableReason: null
        });
    });

    it("lists other registered types after the built-in order, in registration order", async () => {
        const zeta = createTestStepType({
            type: "zeta",
            title: "Zeta",
            availability: { available: false, unavailableReason: "Zeta is off." },
            configSchema: zod.object({ level: zod.number() })
        });
        const alpha = createTestStepType({ type: "alpha", title: "Alpha" });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(zeta.implementation);
                container.register(alpha.implementation);
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes.map(row => row.type)).toEqual([
            "review",
            "ai",
            "automation",
            "zeta",
            "alpha"
        ]);
        expect(stepTypes[3]).toEqual({
            type: "zeta",
            title: "Zeta",
            available: false,
            unavailableReason: "Zeta is off.",
            configSchema: zod.toJSONSchema(zod.object({ level: zod.number() }), {
                io: "input",
                unrepresentable: "any"
            })
        });
        expect(stepTypes[4]).toEqual({
            type: "alpha",
            title: "Alpha",
            available: true,
            unavailableReason: null,
            configSchema: null
        });
    });

    it("lets a registered ai type replace the placeholder row without reading the flag", async () => {
        const ai = createTestStepType({
            type: "ai",
            title: "AI step",
            availability: { available: true, unavailableReason: null },
            configSchema: zod.object({ prompt: zod.string() })
        });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(ai.implementation);
                // The flag is not read when an `ai` type is registered.
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowingFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes.map(row => row.type)).toEqual(["review", "ai", "automation"]);
        expect(stepTypes[1]).toEqual({
            type: "ai",
            title: "AI step",
            available: true,
            unavailableReason: null,
            configSchema: zod.toJSONSchema(zod.object({ prompt: zod.string() }), {
                io: "input",
                unrepresentable: "any"
            })
        });
    });

    it("lists a field with a default as not required (input side of the schema)", async () => {
        const defaulted = createTestStepType({
            type: "defaulted",
            title: "Defaulted",
            configSchema: zod.object({ level: zod.number().default(1) })
        });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(defaulted.implementation);
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        const row = stepTypes.find(item => item.type === "defaulted");
        expect((row?.configSchema?.required ?? []) as string[]).not.toContain("level");
    });

    it("returns the workflow persistence error when a type's schema cannot be converted (R87, R138)", async () => {
        const broken = createTestStepType({ type: "broken-schema", configSchema: {} as never });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(broken.implementation);
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("returns the workflow persistence error when a type's availability throws (R87)", async () => {
        const broken = createTestStepType({
            type: "broken",
            describeAvailability: async () => {
                throw new Error("Availability is down.");
            }
        });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(broken.implementation);
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Availability is down.");
    });

    it("allows a full-access permission set", async () => {
        const { listStepTypes } = await createStepTypesContext({
            permissions: [{ name: "workflows.*" }]
        });

        const result = await listStepTypes.execute();

        expect(result.isOk()).toBe(true);
    });

    it("returns the workflow persistence error when the flag read throws", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowingFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Flags are down.");
    });

    it("refuses a user without editor", async () => {
        const { listStepTypes } = await createStepTypesContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step types" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listStepTypes } = await createStepTypesContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listStepTypes.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws (R87)", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
    });
});
