import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowLookupError } from "~/domain/workflow/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowEditorAccess as Abstraction } from "./abstractions.js";

class WorkflowEditorAccessImpl implements Abstraction.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface
    ) {}

    public async check(action: string): Abstraction.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowLookupError(cause));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action }));
        }
        return Result.ok();
    }
}

export const WorkflowEditorAccess = Abstraction.createImplementation({
    implementation: WorkflowEditorAccessImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions]
});
