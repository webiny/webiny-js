import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "./CmsEntryAccess/index.js";

/**
 * `canUserRead` for `cms.*` targets (D61, D133, R48). The model, group and revision are read as
 * the current identity first, so nothing is read as the other user (A19); only the CMS access
 * check (group read, model read, entry and folder access, R72) runs as that user, through
 * `CandidateReadAccess` (R67).
 */
class CmsEntryReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private candidates: CandidateReadAccess.Interface
    ) {}

    public canHandle(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.entry.entryId !== params.targetId) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => this.access.canRead(target));
    }
}

export const CmsEntryReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: CmsEntryReviewTargetReadAccessImpl,
    dependencies: [CmsEntryTargetReader, CmsEntryAccess, CandidateReadAccess]
});
