import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "./CmsEntryAccess/index.js";
import { CmsModelGroupService } from "./CmsModelGroupService/index.js";
import { CandidateFolderReadRules } from "./CandidateFolderReadRules/index.js";
import type { FolderReadRule } from "./FolderReadRule.js";

/** What every candidate's check needs, read once per call as the current identity. */
interface CandidateReadSubject {
    /** The candidate check, run as the candidate. */
    check: (folderRule: FolderReadRule | undefined) => Promise<boolean>;
    /** The folder a rule is needed for; `null` for the root folder. */
    folderId: string | null;
}

/**
 * `filterReadableUsers` for `cms.*` targets (D61, D133, R48, R121). The model, group, revision and
 * the folder's permission record are read once per call, as the current identity, so nothing is
 * read as the other users (A19) and nothing is read per user (Q79); only the CMS access check
 * (group read, model read, entry and folder access, R72) runs as each user, through
 * `CandidateReadAccess` (R67), which wraps it in `withIdentity` and `withAuthorization`.
 *
 * Contract: this class does not widen access itself, and the CMS model cache is filled
 * per tenant after access filtering. A whole AI step run executes inside `withoutAuthorization`
 * (R161), so the model and group reads of the AI editor happen there; the access checks here
 * apply after the cache and run as the candidate user through `CandidateReadAccess`, the only
 * place that changes identity for the check. Any failure, including a throwing target or model
 * read, leaves the users out (fail closed, R50).
 */
class CmsEntryReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private candidates: CandidateReadAccess.Interface,
        private getModel: GetModelUseCase.Interface,
        private modelGroups: CmsModelGroupService.Interface,
        private folderRules: CandidateFolderReadRules.Interface
    ) {}

    public canHandle(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async filterReadableUsers(
        params: ReviewTargetReadAccess.UsersParams
    ): Promise<string[]> {
        if (params.users.length === 0) {
            return [];
        }
        let subject: CandidateReadSubject | null;
        try {
            subject = await this.readSubject(params);
        } catch {
            return [];
        }
        if (!subject) {
            return [];
        }
        const { check, folderId } = subject;
        let folderRule: FolderReadRule | undefined;
        if (folderId && folderId !== ROOT_FOLDER) {
            folderRule = this.folderRules.create({ folderId, users: params.users });
        }

        const readable: string[] = [];
        // One user at a time, as that user: the check reads nothing, but each user's own
        // permissions load once (cached per identity), so a limited call stops early.
        for (const user of params.users) {
            if (params.limit !== undefined && readable.length >= params.limit) {
                break;
            }
            const canRead = await this.candidates.canUserRead(user, () => check(folderRule));
            if (canRead) {
                readable.push(user.id);
            }
        }
        return readable;
    }

    /**
     * The target revision (or, for a folder without a revision, the model and group, R121) as the
     * current identity; `null` when there is nothing anyone can read.
     */
    private async readSubject(
        params: ReviewTargetReadAccess.UsersParams
    ): Promise<CandidateReadSubject | null> {
        if (params.read.type === "target") {
            const { targetId } = params.read;
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.read.targetRevisionId
            });
            if (!target || target.entry.entryId !== targetId) {
                return null;
            }
            return {
                check: folderRule => this.access.canRead(target, folderRule),
                folderId: target.entry.location?.folderId ?? null
            };
        }

        // Without an entry (the routing inspector): the model and folder only, so a user shown as
        // readable can still lack access to one entry (own-only permissions, A47).
        const modelId = getModelIdFromAppName(params.model);
        if (!modelId) {
            return null;
        }
        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail() || modelResult.value.isPrivate) {
            return null;
        }
        const groupResult = await this.modelGroups.getGroup(modelResult.value);
        if (groupResult.isFail()) {
            return null;
        }
        const model: CmsModel = modelResult.value;
        const group: CmsGroup = groupResult.value;
        const { folderId } = params.read;
        return {
            check: folderRule =>
                this.access.canReadInFolder({ model, group, folderId, folderRule }),
            folderId
        };
    }
}

export const CmsEntryReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: CmsEntryReviewTargetReadAccessImpl,
    dependencies: [
        CmsEntryTargetReader,
        CmsEntryAccess,
        CandidateReadAccess,
        GetModelUseCase,
        CmsModelGroupService,
        CandidateFolderReadRules
    ]
});
