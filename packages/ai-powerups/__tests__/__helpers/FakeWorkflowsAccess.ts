import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";

export const EDITOR_ACTOR: Actor = {
    type: "user",
    id: "user-editor",
    displayName: "Eddie Editor",
    identityType: "admin"
};

export interface FakeWorkflowsAccessOptions {
    /** False is an anonymous identity: `getActor` fails with `WorkflowsNotAuthenticatedError`. */
    signedIn?: boolean;
    /** `false` is a user without `workflows.editor`; an `Error` makes the permission read throw. */
    canEdit?: boolean | Error;
}

/**
 * Registers a `CurrentReviewViewer` and a `WorkflowsPermissions` that answer the options, so the
 * shared configuration use cases of this package can be tested without the workflows engine.
 */
export const registerFakeWorkflowsAccess = (
    container: Container,
    options: FakeWorkflowsAccessOptions = {}
): void => {
    const signedIn = options.signedIn ?? true;
    const canEdit = options.canEdit ?? true;

    container.registerInstance(CurrentReviewViewer, {
        getActor: () => {
            return signedIn
                ? Result.ok(EDITOR_ACTOR)
                : Result.fail(new WorkflowsNotAuthenticatedError());
        },
        get: async () => {
            throw new Error("The fake viewer only answers getActor.");
        }
    } as CurrentReviewViewer.Interface);

    container.registerInstance(WorkflowsPermissions, {
        isFullAccess: async () => canEdit === true,
        canEdit: async () => {
            if (canEdit instanceof Error) {
                throw canEdit;
            }
            return canEdit;
        },
        canReassign: async () => false,
        getPermissionSet: async () => {
            return { fullAccess: canEdit === true, editor: canEdit === true, reassign: false };
        }
    } as WorkflowsPermissions.Interface);
};
