import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { CollabLocatorResolver } from "~/domain/locator/abstractions.js";
import { CONTENT_TYPE_CMS_ENTRY } from "~/constants.js";
import { parseCmsContentId } from "~/utils/cmsContentId.js";
import { walkModelLocator } from "./modelLocator.js";

class CmsLocatorResolverImpl implements CollabLocatorResolver.Interface {
    public readonly contentType = CONTENT_TYPE_CMS_ENTRY;

    constructor(
        private getModel: GetModelUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface
    ) {}

    async resolve(params: CollabLocatorResolver.Params): Promise<CollabLocatorResolver.Resolution> {
        const { modelId, entryId } = parseCmsContentId(params.contentId);
        if (!modelId || !entryId) {
            return { exists: false, authorized: false };
        }

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            // Model missing or not readable — treat as no access.
            return { exists: false, authorized: false };
        }

        const model = modelResult.value;

        // Loading the current revision is the read-access gate: it fails with
        // "Cms/Entry/NotAuthorized" when the caller may not read the entry.
        const entryResult = await this.getLatestRevision.execute(model, { id: entryId });
        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotAuthorized") {
                return { exists: false, authorized: false };
            }
            // Entry itself is gone (deleted / never existed) — authorized but orphaned.
            return { exists: false, authorized: true };
        }

        const contentTitle = getEntryTitle(model, entryResult.value);

        // Empty locator = an entry-level (unanchored) comment. The entry read above is the
        // access gate; the anchor is the entry itself.
        if (!params.locator || params.locator.trim().length === 0) {
            return { exists: true, authorized: true, label: "Entry", path: [], contentTitle };
        }

        const walk = walkModelLocator(model, params.locator);

        return {
            exists: walk.exists,
            authorized: true,
            label: walk.label,
            path: walk.path,
            contentTitle
        };
    }
}

export const CmsLocatorResolver = CollabLocatorResolver.createImplementation({
    implementation: CmsLocatorResolverImpl,
    dependencies: [GetModelUseCase, GetLatestRevisionByEntryIdUseCase]
});
