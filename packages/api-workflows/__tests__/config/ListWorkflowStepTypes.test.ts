import { beforeEach, describe, expect, it } from "vitest";
import zod from "zod";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";

const FIXED_MESSAGE = "The workflow could not be read or saved.";

const expectFixedFailure = (
    result: Awaited<ReturnType<ListWorkflowStepTypesUseCase.Interface["execute"]>>,
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

/** Throws when `aiPowerups` is read; every other flag answers as before. */
class ThrowsOnAiPowerupsFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get() {
        const flags = this.decoratee.get();
        const isEnabled = flags.isEnabled.bind(flags);
        flags.isEnabled = name => {
            if (name === "aiPowerups") {
                throw new Error("Flags are down.");
            }
            return isEnabled(name);
        };
        return flags;
    }
}

interface StepTypesContextParams extends CmsTestHandlerParams {
    /** The teams switch; on unless a test says otherwise. */
    teams?: TeamsFlagValue;
}

const createStepTypesContext = async (params: StepTypesContextParams = {}) => {
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            setTeamsFlag(container, params.teams ?? true);
            await params.setup?.(container);
        }
    });
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

    it("marks the review type unavailable with its reason when teams are off (Q58, R290)", async () => {
        const { listStepTypes } = await createStepTypesContext({ teams: false });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes.map(row => row.type)).toEqual(["review", "ai", "automation"]);
        expect(stepTypes[0]).toEqual({
            type: "review",
            title: "Review",
            available: false,
            unavailableReason: "Teams are not enabled.",
            configSchema: zod.toJSONSchema(reviewStepConfigSchema, {
                io: "input",
                unrepresentable: "any"
            })
        });
    });

    it("leaves the AI and automation rows as they are when teams are off", async () => {
        const { listStepTypes } = await createStepTypesContext({
            teams: false,
            setup: container => {
                registerTestAutomation(container);
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: AiPowerupsEnabledFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes[1]).toMatchObject({ type: "ai", available: true });
        expect(stepTypes[2]).toMatchObject({ type: "automation", available: true });
    });

    it("reads the teams switch on every request, not at registration (R287)", async () => {
        let teamsOn = true;
        const { listStepTypes } = await createStepTypesContext({ teams: () => teamsOn });

        const on = expectOk(await listStepTypes.execute());
        teamsOn = false;
        const off = expectOk(await listStepTypes.execute());
        teamsOn = true;
        const onAgain = expectOk(await listStepTypes.execute());

        expect(on[0]).toMatchObject({ available: true, unavailableReason: null });
        expect(off[0]).toMatchObject({
            available: false,
            unavailableReason: "Teams are not enabled."
        });
        expect(onAgain[0]).toMatchObject({ available: true, unavailableReason: null });
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
                // The `aiPowerups` flag is not read when an `ai` type is registered; the review
                // row still reads the teams flag.
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowsOnAiPowerupsFeatureFlags,
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
                captureLoggedErrors(container);
                container.register(broken.implementation);
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe(FIXED_MESSAGE);
        expect(loggedErrors).toHaveLength(1);
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
                captureLoggedErrors(container);
                container.register(broken.implementation);
            }
        });

        const result = await listStepTypes.execute();

        expectFixedFailure(result, "Availability is down.");
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
                captureLoggedErrors(container);
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowingFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const result = await listStepTypes.execute();

        expectFixedFailure(result, "Flags are down.");
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
                captureLoggedErrors(container);
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listStepTypes.execute();

        expectFixedFailure(result, "Permissions are down.");
    });
});
