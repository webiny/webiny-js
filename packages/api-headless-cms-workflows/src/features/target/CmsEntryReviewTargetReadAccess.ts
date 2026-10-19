import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "./CmsEntryAccess/index.js";

/**
 * `canUserRead` and `canUserReadInFolder` for `cms.*` targets (D61, D133, R48, R121). The model,
 * group and revision are read as the current identity first, so nothing is read as the other user
 * (A19); only the CMS access check (group read, model read, entry and folder access, R72) runs as
 * that user, through `CandidateReadAccess` (R67), which wraps it in `withIdentity` and
 * `withAuthorization`.
 *
 * Contract: this class does not widen access itself, and the CMS model cache is filled
 * per tenant after access filtering. A whole AI step run executes inside `withoutAuthorization`
 * (R161), so the model and group reads of the AI editor happen there; the access checks here
 * apply after the cache and run as the candidate user through `CandidateReadAccess`, the only
 * place that changes identity for the check. Any failure, including a throwing target or model read, answers `false` (fail closed, R50).
 */
class CmsEntryReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private candidates: CandidateReadAccess.Interface,
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface
    ) {}

    public canHandle(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        let target: CmsEntryTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
        } catch {
            return false;
        }
        if (!target || target.entry.entryId !== params.targetId) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => this.access.canRead(target));
    }

    /**
     * Without an entry (the routing inspector): the model and folder only, so a user shown as
     * readable can still lack access to one entry (own-only permissions, A47).
     */
    public async canUserReadInFolder(
        params: ReviewTargetReadAccess.FolderReadParams
    ): Promise<boolean> {
        const modelId = getModelIdFromAppName(params.model);
        if (!modelId) {
            return false;
        }
        let model: CmsModel;
        let group: CmsGroup;
        try {
            const modelResult = await this.getModel.execute(modelId);
            if (modelResult.isFail() || modelResult.value.isPrivate) {
                return false;
            }
            const groupResult = await this.getGroup.execute(modelResult.value.group);
            if (groupResult.isFail()) {
                return false;
            }
            model = modelResult.value;
            group = groupResult.value;
        } catch {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => {
            return this.access.canReadInFolder({ model, group, folderId: params.folderId });
        });
    }
}

export const CmsEntryReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: CmsEntryReviewTargetReadAccessImpl,
    dependencies: [
        CmsEntryTargetReader,
        CmsEntryAccess,
        CandidateReadAccess,
        GetModelUseCase,
        GetGroupUseCase
    ]
});
