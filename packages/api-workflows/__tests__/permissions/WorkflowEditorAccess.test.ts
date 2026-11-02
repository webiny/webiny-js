import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createAccessContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        editorAccess: context.container.resolve(WorkflowEditorAccess)
    };
};

describe("WorkflowEditorAccess", () => {
    it("allows an editor", async () => {
        const { editorAccess } = await createAccessContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        const result = await editorAccess.check("list users");

        expect(result.isOk()).toBe(true);
    });

    it("refuses an identity that is not signed in", async () => {
        const { container, editorAccess } = await createAccessContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => editorAccess.check("list users"));

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("refuses a user without editor, naming the action", async () => {
        const { editorAccess } = await createAccessContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await editorAccess.check("list users");

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.message).toBe("You are not allowed to list users.");
        expect(result.error.data).toEqual({ action: "list users" });
    });

    it("returns the lookup error when the permission load throws", async () => {
        const { editorAccess } = await createAccessContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await editorAccess.check("list users");

        expect(result.error.code).toBe("Workflows/Workflow/Lookup");
        expect(result.error.message).toBe("A lookup the workflow editor needs failed.");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Permissions are down."
        );
    });
});
