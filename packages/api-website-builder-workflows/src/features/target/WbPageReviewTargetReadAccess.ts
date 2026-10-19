import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { WbPageAccess } from "./WbPageAccess/index.js";

/**
 * `canUserRead` for pages (D61, D133, R48): the page is read as the current identity, only the WB
 * access check runs as the other user, through `CandidateReadAccess` (R67). `canUserReadInFolder`
 * (R121) has no page: only the folder-level check runs as the other user.
 *
 * Contract: reach this only as the request identity, never from inside
 * `withoutAuthorization`. The page model is read through `PageModelProvider`, which uses the CMS
 * model cache (filled per tenant after access filtering), so a read without authorization would
 * cache the unfiltered list for every later caller. `CandidateReadAccess` is the only place that
 * changes identity for the check. Any failure, including a throwing target read, answers `false`
 * (fail closed, R50).
 */
class WbPageReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private candidates: CandidateReadAccess.Interface
    ) {}

    public canHandle(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        let target: WbPageTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
        } catch {
            return false;
        }
        if (!target || target.page.entryId !== params.targetId) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => this.access.canRead(target));
    }

    public async canUserReadInFolder(
        params: ReviewTargetReadAccess.FolderReadParams
    ): Promise<boolean> {
        if (params.model !== WB_PAGE_NAMESPACE) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => {
            return this.access.canReadInFolder(params.folderId);
        });
    }
}

export const WbPageReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: WbPageReviewTargetReadAccessImpl,
    dependencies: [WbPageTargetReader, WbPageAccess, CandidateReadAccess]
});
