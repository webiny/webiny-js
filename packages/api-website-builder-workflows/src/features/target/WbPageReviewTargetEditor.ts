import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorField,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { WbPageAccess } from "./WbPageAccess/index.js";
import { toWbPageEditorFields } from "./toWbPageEditorFields.js";
import { describeWbPageEditorValue, isWbPageEditorValue } from "./isWbPageEditorValue.js";
import { toWbPageProperties } from "./toWbPageProperties.js";

/**
 * The `wb.page` editor of the AI step's built-in tools (spec 9.3, R172). `read` returns the whole
 * page (the element tree as a summary); `update` writes `properties.title` and the SEO scalars
 * `properties.seo.{title,description,canonicalUrl,noIndex,noFollow}` only, atomically, as the full
 * merged `properties` through the page update (`properties` only, so the element tree, bindings,
 * metadata and location are never in the write). The page is read as the request identity and
 * `WbPageAccess.canRead` decides whether it is visible; the write goes through
 * `UpdatePageUseCase`, which checks the write permission itself. The save-block bypass is the
 * tool's business (R173): this class neither reads nor sets it. Throws and failed Results become
 * failed Results with a fixed text, the real error is logged (R87).
 */
class WbPageReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private updatePage: UpdatePageUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public canEdit(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>> {
        try {
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (
                !target ||
                target.page.entryId !== params.targetId ||
                !(await this.access.canRead(target))
            ) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }

            // Inside the try: a malformed page makes these throw, and that must be a failed
            // Result, never a rejection (R87).
            return Result.ok({
                title: target.page.properties.title,
                fields: toWbPageEditorFields(target.page)
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
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>> {
        const paths = Object.keys(params.values);
        if (paths.length === 0) {
            return Result.fail(new ReviewTargetEditorError("No fields were given."));
        }

        let properties: Record<string, unknown>;
        try {
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (
                !target ||
                target.page.entryId !== params.targetId ||
                !(await this.access.canRead(target))
            ) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }

            // A Map, so a key such as "__proto__" is just an unknown path.
            const fields = new Map<string, ReviewTargetEditorField>();
            for (const field of toWbPageEditorFields(target.page)) {
                fields.set(field.path, field);
            }
            const problems: string[] = [];
            for (const path of paths) {
                const field = fields.get(path);
                if (!field) {
                    problems.push(`Unknown field "${path}". Use the paths returned by readTarget.`);
                } else if (!field.writable) {
                    problems.push(`The field "${path}" is read-only.`);
                } else if (!isWbPageEditorValue(path, params.values[path])) {
                    problems.push(
                        `The field "${path}" expects ${describeWbPageEditorValue(path)}.`
                    );
                }
            }
            if (problems.length > 0) {
                return Result.fail(new ReviewTargetEditorError(problems.join(" ")));
            }

            properties = toWbPageProperties(target.page.properties, params.values);
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not read the target for the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be read."));
        }

        try {
            const result = await this.updatePage.execute(params.targetRevisionId, { properties });
            if (result.isFail()) {
                // The page use case wraps CMS messages, so its text is never shown to the model.
                this.logger.error(
                    { error: result.error, model: params.model, targetId: params.targetId },
                    "Could not update the target from the AI editor."
                );
                return Result.fail(new ReviewTargetEditorError("The target could not be updated."));
            }
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not update the target from the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be updated."));
        }

        return Result.ok({ applied: paths });
    }
}

export const WbPageReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: WbPageReviewTargetEditorImpl,
    dependencies: [WbPageTargetReader, WbPageAccess, UpdatePageUseCase, Logger]
});
