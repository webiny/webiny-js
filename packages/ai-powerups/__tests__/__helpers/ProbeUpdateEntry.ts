import type {
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { getErrorCode } from "./AuthorEntries.js";

/** What one update inside the bypass window saw. */
export interface BypassProbeResult {
    /** `IdentityContext.getIdentity().id` inside the bypass window (R161). */
    identityId: string;
    /** The error code of the refused trash, or `null` when it was NOT refused. */
    trashRefusedWith: string | null;
    permanentDeleteRefusedWith: string | null;
    moveRefusedWith: string | null;
}

export interface BypassProbe {
    enabled: boolean;
    /** One entry per update that ran inside the bypass window while `enabled`. */
    results: BypassProbeResult[];
}

/** Set `enabled` for the test; reset it in `beforeEach`. */
export const bypassProbe: BypassProbe = { enabled: false, results: [] };

export const resetBypassProbe = (): void => {
    bypassProbe.enabled = false;
    bypassProbe.results.length = 0;
};

class ProbeUpdateEntryImpl implements UpdateEntryUseCase.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private identityContext: IdentityContext.Interface,
        private remove: DeleteEntryUseCase.Interface,
        private move: MoveEntryUseCase.Interface,
        private decoratee: UpdateEntryUseCase.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateEntryUseCase.Input<T>,
        options?: UpdateCmsEntryOptionsInput
    ): UpdateEntryUseCase.Return<T> {
        if (bypassProbe.enabled && this.bypass.isActive()) {
            const trashed = await this.remove.execute(model, id, { permanently: false });
            const deleted = await this.remove.execute(model, id, { permanently: true });
            const moved = await this.move.execute(model, id, "folder-2");
            bypassProbe.results.push({
                identityId: this.identityContext.getIdentity().id,
                trashRefusedWith: getErrorCode(trashed),
                permanentDeleteRefusedWith: getErrorCode(deleted),
                moveRefusedWith: getErrorCode(moved)
            });
        }
        return this.decoratee.execute<T>(model, id, input, options);
    }
}

export const ProbeUpdateEntry = UpdateEntryUseCase.createDecorator({
    decorator: ProbeUpdateEntryImpl,
    dependencies: [WorkflowBypassService, IdentityContext, DeleteEntryUseCase, MoveEntryUseCase]
});
