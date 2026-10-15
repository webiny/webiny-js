import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { toEditorFields } from "./toEditorFields.js";

/**
 * The `cms.<modelId>` editor of the AI step's built-in tools (spec 9.3, R172). `read` returns the
 * whole revision; the model and group are read as the request identity through
 * `CmsEntryTargetReader` (SEC-66). Throws become failed Results with a text safe to show the model
 * (R87).
 */
class CmsEntryReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private logger: Logger.Interface
    ) {}

    public canEdit(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>> {
        try {
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (!target || target.entry.entryId !== params.targetId) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }

            // Inside the try: a malformed model makes these throw, and that must be a failed
            // Result, never a rejection (R87).
            return Result.ok({
                title: getEntryTitle(target.model, target.entry),
                fields: toEditorFields(target.model, target.entry.values)
            });
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not read the target for the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be read."));
        }
    }

    public async update(
        _params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>> {
        return Result.fail(new ReviewTargetEditorError("This target cannot be edited."));
    }
}

export const CmsEntryReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: CmsEntryReviewTargetEditorImpl,
    dependencies: [CmsEntryTargetReader, Logger]
});
