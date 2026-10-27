import { describe, expect, it } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTeam, FakeListUserTeams } from "~tests/__helpers/FakeListUserTeams.js";
import {
    createRequestedReview,
    expectOk,
    REVIEW_TEAM_ID,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { getReviewViewerFlags } from "~/domain/review/getReviewViewerFlags.js";
import { canCancelByPermission } from "~/domain/review/canCancelByPermission.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";

/** An API key identity, as api-core's `ApiKeyAuthenticator` builds it (`type: "api-key"`). */
const apiKeyIdentity = (): AuthenticatedIdentity => {
    return new AuthenticatedIdentity({
        id: "api-key-1",
        displayName: "CI key",
        type: "api-key"
    });
};

const createViewerContext = async (permissions: SecurityPermission[]) => {
    const fake = new FakeListUserTeams(new Map([[DEFAULT_USER_ID, [createTeam(REVIEW_TEAM_ID)]]]));
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(ListUserTeamsUseCase, fake);
        }
    });
    return {
        fake,
        container: context.container,
        viewer: context.container.resolve(CurrentReviewViewer)
    };
};

describe("CurrentReviewViewer", () => {
    it("builds the viewer from the identity, its teams and its workflows permissions", async () => {
        const { viewer } = await createViewerContext([{ name: "workflows", reassign: true }]);

        expect(expectOk(await viewer.get())).toEqual({
            actor: {
                type: "user",
                id: DEFAULT_USER_ID,
                displayName: "John Doe",
                identityType: "admin"
            },
            teamIds: [REVIEW_TEAM_ID],
            permissions: { fullAccess: false, editor: false, reassign: true }
        });
    });

    it("builds the actor without looking up teams or permissions", async () => {
        const { fake, viewer } = await createViewerContext([{ name: "workflows", editor: true }]);

        expect(expectOk(viewer.getActor())).toEqual({
            type: "user",
            id: DEFAULT_USER_ID,
            displayName: "John Doe",
            identityType: "admin"
        });
        expect(fake.calls).toEqual([]);
    });

    it("fails for an anonymous identity", async () => {
        const { container, viewer } = await createViewerContext([{ name: "*" }]);
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            viewer.get()
        );
        const actor = await identityContext.withIdentity(new AnonymousIdentity(), async () =>
            viewer.getActor()
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(actor.isFail()).toBe(true);
        expect(actor.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("lets an API key act as a user actor without teams (D133)", async () => {
        const { container, viewer } = await createViewerContext([{ name: "workflows" }]);
        const identityContext = container.resolve(IdentityContext);

        const current = expectOk(
            await identityContext.withIdentity(apiKeyIdentity(), () => viewer.get())
        );

        expect(current).toMatchObject({
            actor: {
                type: "user",
                id: "api-key-1",
                displayName: "CI key",
                identityType: "api-key"
            },
            teamIds: []
        });
        // No team: the key cannot start a pool step, but it can cancel the review it requested.
        const othersReview = toSaveData(createRequestedReview());
        expect(getReviewViewerFlags(othersReview, current).canStart).toBe(false);
        const ownReview = toSaveData(createRequestedReview({ requester: current.actor }));
        expect(canCancelByPermission(ownReview, current)).toBe(true);
    });

    it("feeds the viewer flags of a review", async () => {
        const { viewer } = await createViewerContext([{ name: "workflows.*" }]);
        const current = expectOk(await viewer.get());

        const flags = getReviewViewerFlags(toSaveData(createRequestedReview()), current);

        expect(flags.canStart).toBe(true);
        expect(flags.canCancel).toBe(true);
        expect(flags.canReassign).toBe(true);
    });
});
