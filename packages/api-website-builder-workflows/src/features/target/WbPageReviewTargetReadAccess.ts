import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { CandidateFolderReadRules } from "@webiny/api-headless-cms-workflows/features/target/CandidateFolderReadRules/index.js";
import type { FolderReadRule } from "@webiny/api-headless-cms-workflows/features/target/FolderReadRule.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { WbPageAccess } from "./WbPageAccess/index.js";

/** What every candidate's check needs, read once per call as the current identity. */
interface CandidateReadSubject {
    /** The candidate check, run as the candidate. */
    check: (folderRule: FolderReadRule | undefined) => Promise<boolean>;
    /** The folder a rule is needed for; `null` for the root folder. */
    folderId: string | null;
}

/**
 * `filterReadableUsers` for pages (D61, D133, R48): the page and the folder's permission record
 * are read once per call, as the current identity (Q79); only the WB access check runs as each
 * user, through `CandidateReadAccess` (R67). For a folder without a page (R121) only the
 * folder-level check runs as each user.
 *
 * Contract: reach this only as the request identity, never from inside
 * `withoutAuthorization`. The page model is read through `PageModelProvider`, which uses the CMS
 * model cache (filled per tenant after access filtering), so a read without authorization would
 * cache the unfiltered list for every later caller. `CandidateReadAccess` is the only place that
 * changes identity for the check. Any failure, including a throwing target read, leaves the users
 * out (fail closed, R50).
 */
class WbPageReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private candidates: CandidateReadAccess.Interface,
        private folderRules: CandidateFolderReadRules.Interface
    ) {}

    public canHandle(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async filterReadableUsers(
        params: ReviewTargetReadAccess.UsersParams
    ): Promise<string[]> {
        if (params.users.length === 0 || params.model !== WB_PAGE_NAMESPACE) {
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

    /** The page revision, or the folder without a page (R121); `null` when nothing is readable. */
    private async readSubject(
        params: ReviewTargetReadAccess.UsersParams
    ): Promise<CandidateReadSubject | null> {
        if (params.read.type === "folder") {
            const { folderId } = params.read;
            return {
                check: folderRule => this.access.canReadInFolder(folderId, folderRule),
                folderId
            };
        }
        const { targetId } = params.read;
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.read.targetRevisionId
        });
        if (!target || target.page.entryId !== targetId) {
            return null;
        }
        return {
            check: folderRule => this.access.canRead(target, folderRule),
            folderId: target.page.location.folderId ?? null
        };
    }
}

export const WbPageReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: WbPageReviewTargetReadAccessImpl,
    dependencies: [WbPageTargetReader, WbPageAccess, CandidateReadAccess, CandidateFolderReadRules]
});
