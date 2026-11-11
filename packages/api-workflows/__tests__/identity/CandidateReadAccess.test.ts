import { describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Result } from "@webiny/feature/api";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { CandidateReadAccess } from "~/features/identity/CandidateReadAccess/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";

const REASSIGNER = { id: "user-reassigner", displayName: "Reassigner" };
const PLAIN = { id: "user-plain", displayName: "Plain" };

/** Counts user reads: the candidate is the user the caller listed, so none is read. */
class CountingGetUser implements GetUserUseCase.Interface {
    public calls = 0;

    public async execute(): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        this.calls++;
        throw new Error("No user is read for a candidate.");
    }
}

const createCandidateContext = async () => {
    const getUser = new CountingGetUser();
    const { context } = await createContextHandler({
        // The request identity is an editor, so "no permissions" below cannot be inherited (R70).
        permissions: [{ name: "workflows", editor: true }],
        permissionsByIdentity: {
            "user-reassigner": [{ name: "workflows", reassign: true }]
        },
        setup: container => {
            container.registerInstance(GetUserUseCase, getUser);
        }
    });
    return {
        candidates: context.container.resolve(CandidateReadAccess),
        permissions: context.container.resolve(WorkflowsPermissions),
        identityContext: context.container.resolve(IdentityContext),
        getUser
    };
};

describe("CandidateReadAccess", () => {
    it("answers the check as the given admin user", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();
        let inside: Identity | null = null;

        const canReassign = await candidates.canUserRead(REASSIGNER, async () => {
            inside = identityContext.getIdentity();
            return permissions.canReassign();
        });

        expect(canReassign).toBe(true);
        expect(inside).toMatchObject({ id: "user-reassigner", type: "admin" });
    });

    it("restores the request identity and its permissions afterwards", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();

        await candidates.canUserRead(REASSIGNER, () => permissions.canReassign());

        expect(identityContext.getIdentity().id).toBe(DEFAULT_USER_ID);
        expect(await permissions.canEdit()).toBe(true);
        expect(await permissions.canReassign()).toBe(false);
    });

    it("grants nothing to an admin user without permissions (R70)", async () => {
        const { candidates, permissions } = await createCandidateContext();

        const canEdit = await candidates.canUserRead(PLAIN, () => permissions.canEdit());

        expect(canEdit).toBe(false);
    });

    it("reads no user: the caller passes the user it listed (R68)", async () => {
        const { candidates, permissions, getUser } = await createCandidateContext();

        await candidates.canUserRead(REASSIGNER, () => permissions.canReassign());
        await candidates.canUserRead(PLAIN, () => permissions.canEdit());

        expect(getUser.calls).toBe(0);
    });

    it("checks the user's real permissions inside withoutAuthorization (R67)", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();

        const result = await identityContext.withoutAuthorization(() => {
            return candidates.canUserRead(PLAIN, () => permissions.canEdit());
        });

        expect(result).toBe(false);
    });

    it("fails closed when the check throws", async () => {
        const { candidates } = await createCandidateContext();

        const result = await candidates.canUserRead(REASSIGNER, async () => {
            throw new Error("Storage is down.");
        });

        expect(result).toBe(false);
    });

    it("reuses one identity per user within the request (R69)", async () => {
        const { candidates, identityContext } = await createCandidateContext();
        const seen: Identity[] = [];

        for (let i = 0; i < 2; i++) {
            await candidates.canUserRead(REASSIGNER, async () => {
                seen.push(identityContext.getIdentity());
                return true;
            });
        }

        expect(seen[0]).toBe(seen[1]);
    });
});
