import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { CollabLocatorResolver } from "~/api/domain/locator/abstractions.js";
import { CONTENT_TYPE_CMS_ENTRY } from "~/shared/constants.js";
import { parseCmsContentId } from "~/api/utils/cmsContentId.js";
import { itemStillExists, walkModelLocator } from "./modelLocator.js";

class CmsLocatorResolverImpl implements CollabLocatorResolver.Interface {
    public readonly contentType = CONTENT_TYPE_CMS_ENTRY;

    constructor(
        private getModel: GetModelUseCase.Interface,
        private getEntry: GetEntryUseCase.Interface,
        private getLatestRevisionIncludingDeleted: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface
    ) {}

    async resolve(params: CollabLocatorResolver.Params): Promise<CollabLocatorResolver.Resolution> {
        const { modelId, entryId } = parseCmsContentId(params.contentId);
        if (!modelId || !entryId) {
            return { exists: false, authorized: false };
        }

        const modelResult = await this.getModel.execute(modelId);
        // Model missing or not readable — treat as no access. Private models are internal and
        // skip CMS authorization, so they are treated as missing too.
        if (modelResult.isFail() || modelResult.value.isPrivate) {
            return { exists: false, authorized: false };
        }

        const model = modelResult.value;

        // Security: loading the latest revision through GetEntryUseCase is the read-access gate.
        // It applies model, own-entry and folder level permissions (incl. trashed entries).
        const entryResult = await this.getEntry.execute(model, {
            where: { entryId, latest: true }
        });
        if (entryResult.isFail()) {
            if (entryResult.error.code !== "Cms/Entry/NotFound") {
                return { exists: false, authorized: false };
            }
            // The gated read hides entries the caller may not access, so "not found" is only
            // trusted when the entry is really gone (permanently deleted / never existed).
            const existing = await this.getLatestRevisionIncludingDeleted.execute(model, {
                id: entryId
            });
            if (existing.isFail() && existing.error.code === "Cms/Entry/NotFound") {
                // Authorized but orphaned.
                return { exists: false, authorized: true };
            }
            return { exists: false, authorized: false };
        }

        // Trashed entry the caller can access — authorized, but the anchor is gone.
        if (entryResult.value.wbyDeleted) {
            return { exists: false, authorized: true };
        }

        const contentTitle = getEntryTitle(model, entryResult.value);

        // Empty locator = an entry-level (unanchored) comment. The entry read above is the
        // access gate; the anchor is the entry itself.
        if (!params.locator || params.locator.trim().length === 0) {
            return { exists: true, authorized: true, label: "Entry", path: [], contentTitle };
        }

        const walk = walkModelLocator(model, params.locator);

        // For an id-anchored locator, also confirm the referenced array item still exists in the
        // loaded values — a deleted list element makes the thread gracefully "outdated". The check
        // is conservative and only downgrades `exists` on a confirmed-missing item.
        const exists =
            walk.exists && itemStillExists(model, entryResult.value.values, params.locator);

        return {
            exists,
            authorized: true,
            label: walk.label,
            path: walk.path,
            contentTitle
        };
    }
}

export const CmsLocatorResolver = CollabLocatorResolver.createImplementation({
    implementation: CmsLocatorResolverImpl,
    dependencies: [
        GetModelUseCase,
        GetEntryUseCase,
        GetLatestRevisionByEntryIdIncludingDeletedUseCase
    ]
});
