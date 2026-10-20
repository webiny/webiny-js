import { describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeAdminUsers } from "~tests/__helpers/FakeAdminUsers.js";
import { CandidateReadAccess } from "~/features/identity/CandidateReadAccess/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";

const createCandidateContext = async () => {
    const { context } = await createContextHandler({
        // The request identity is an editor, so "no permissions" below cannot be inherited (R70).
        permissions: [{ name: "workflows", editor: true }],
        permissionsByIdentity: {
            "user-reassigner": [{ name: "workflows", reassign: true }]
        },
        setup: container => {
            container.registerInstance(
                GetUserUseCase,
                new FakeAdminUsers(["user-reassigner", "user-plain"])
            );
        }
    });
    return {
        candidates: context.container.resolve(CandidateReadAccess),
        permissions: context.container.resolve(WorkflowsPermissions),
        identityContext: context.container.resolve(IdentityContext)
    };
};

describe("CandidateReadAccess", () => {
    it("answers the check as the given admin user", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();
        let inside: Identity | null = null;

        const canReassign = await candidates.canUserRead("user-reassigner", async () => {
            inside = identityContext.getIdentity();
            return permissions.canReassign();
        });

        expect(canReassign).toBe(true);
        expect(inside).toMatchObject({ id: "user-reassigner", type: "admin" });
    });

    it("restores the request identity and its permissions afterwards", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();

        await candidates.canUserRead("user-reassigner", () => permissions.canReassign());

        expect(identityContext.getIdentity().id).toBe(DEFAULT_USER_ID);
        expect(await permissions.canEdit()).toBe(true);
        expect(await permissions.canReassign()).toBe(false);
    });

    it("grants nothing to an admin user without permissions (R70)", async () => {
        const { candidates, permissions } = await createCandidateContext();

        const canEdit = await candidates.canUserRead("user-plain", () => permissions.canEdit());

        expect(canEdit).toBe(false);
    });

    it("denies a user who is not an admin user of the current tenant, without running the check (R68)", async () => {
        const { candidates } = await createCandidateContext();
        let ran = false;

        const result = await candidates.canUserRead("user-elsewhere", async () => {
            ran = true;
            return true;
        });

        expect(result).toBe(false);
        expect(ran).toBe(false);
    });

    it("checks the user's real permissions inside withoutAuthorization (R67)", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();

        const result = await identityContext.withoutAuthorization(() => {
            return candidates.canUserRead("user-plain", () => permissions.canEdit());
        });

        expect(result).toBe(false);
    });

    it("fails closed when the check throws", async () => {
        const { candidates } = await createCandidateContext();

        const result = await candidates.canUserRead("user-reassigner", async () => {
            throw new Error("Storage is down.");
        });

        expect(result).toBe(false);
    });

    it("reuses one identity per user within the request (R69)", async () => {
        const { candidates, identityContext } = await createCandidateContext();
        const seen: Identity[] = [];

        for (let i = 0; i < 2; i++) {
            await candidates.canUserRead("user-reassigner", async () => {
                seen.push(identityContext.getIdentity());
                return true;
            });
        }

        expect(seen[0]).toBe(seen[1]);
    });
});
