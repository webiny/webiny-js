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
                configSchema: zod.toJSONSchema(reviewStepConfigSchema)
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
                configSchema: null
            }
        ]);
        expect(stepTypes[0].configSchema).toMatchObject({
            type: "object",
            required: ["teams", "assignment"]
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
