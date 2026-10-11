import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CurrentUserTeams } from "~/features/identity/CurrentUserTeams/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthenticatedError } from "~/domain/permissions/errors.js";
import type { ReviewViewer } from "~/domain/review/types.js";
import { CurrentReviewViewer as Abstraction } from "./abstractions.js";

/**
 * Reads the identity on every call (no cache): its parts are cached by their own owners. Every
 * non-anonymous identity is a `user` actor; `identityType` keeps its kind (`admin`, `api-key`,
 * D30, D133). An API key belongs to no team, so `teamIds` is `[]` for it (A16).
 */
class CurrentReviewViewerImpl implements Abstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private currentUserTeams: CurrentUserTeams.Interface,
        private permissions: WorkflowsPermissions.Interface
    ) {}

    public getActor(): Abstraction.ActorResult {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new WorkflowsNotAuthenticatedError());
        }
        return Result.ok({
            type: "user",
            id: identity.id,
            displayName: identity.displayName,
            identityType: identity.type
        });
    }

    public async get(): Abstraction.Return {
        const actor = this.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const [teamIds, permissions] = await Promise.all([
            this.currentUserTeams.getTeamIds(),
            this.permissions.getPermissionSet()
        ]);
        const viewer: ReviewViewer = {
            actor: actor.value,
            teamIds,
            permissions
        };
        return Result.ok(viewer);
    }
}

export const CurrentReviewViewer = Abstraction.createImplementation({
    implementation: CurrentReviewViewerImpl,
    dependencies: [IdentityContext, CurrentUserTeams, WorkflowsPermissions]
});
