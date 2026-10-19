import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorField,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { toEditorFields } from "./toEditorFields.js";
import { describeEditorFieldValue, isEditorFieldValue } from "./isEditorFieldValue.js";
import { toEntryValuesPatch } from "./toEntryValuesPatch.js";
import {
    GENERIC_VALIDATION_MESSAGE,
    getModelSafeValidationMessage
} from "./getModelSafeValidationMessage.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";

/**
 * The `cms.<modelId>` editor of the AI step's built-in tools (spec 9.3, R172). `read` returns the
 * whole revision; `update` writes top-level and nested object fields of the five writable types by
 * dotted path, atomically, through the CMS entry update (so field validators run). The model and
 * group are read as the request identity through `CmsEntryTargetReader`. The save-block
 * bypass is the tool's business (R173): this class neither reads nor sets it. Throws become failed
 * Results with a text safe to show the model (R87).
 */
class CmsEntryReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
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
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>> {
        const paths = Object.keys(params.values);
        if (paths.length === 0) {
            return Result.fail(new ReviewTargetEditorError("No fields were given."));
        }

        let target: CmsEntryTargetReader.Target;
        let patch: Record<string, unknown>;
        try {
            const read = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (!read || read.entry.entryId !== params.targetId) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }
            target = read;

            // A Map, so a key such as "__proto__" is just an unknown path.
            const fields = new Map<string, ReviewTargetEditorField>();
            for (const field of toEditorFields(target.model, target.entry.values)) {
                fields.set(field.path, field);
            }
            const problems: string[] = [];
            for (const path of paths) {
                const field = fields.get(path);
                if (!field) {
                    problems.push(`Unknown field "${path}". Use the paths returned by readTarget.`);
                } else if (!field.writable) {
                    problems.push(`The field "${path}" is read-only.`);
                } else if (!isEditorFieldValue(field.type, params.values[path])) {
                    problems.push(
                        `The field "${path}" expects ${describeEditorFieldValue(field.type)}.`
                    );
                }
            }
            if (problems.length > 0) {
                return Result.fail(new ReviewTargetEditorError(problems.join(" ")));
            }

            patch = toEntryValuesPatch(target.entry.values, params.values);
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not read the target for the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be read."));
        }

        try {
            const result = await this.updateEntry.execute(target.model, params.targetRevisionId, {
                values: patch
            });
            if (result.isFail()) {
                if (result.error.code === "Cms/Entry/ValidationError") {
                    const invalid: string[] = [];
                    for (const item of result.error.data ?? []) {
                        const itemPath: string[] = [...item.parents, item.fieldId];
                        const safe = getModelSafeValidationMessage(
                            target.model,
                            itemPath,
                            item.error
                        );
                        if (safe === null) {
                            // A validator that threw, or one nobody registered: raw text, never
                            // shown to the model.
                            this.logger.error(
                                {
                                    err: hasErrorSource(item.error)
                                        ? item.error.source
                                        : item.error,
                                    model: params.model,
                                    targetId: params.targetId,
                                    path: itemPath.join(".")
                                },
                                "A field validator failed while the AI editor updated the target."
                            );
                        }
                        invalid.push(
                            `${itemPath.join(".")}: ${safe ?? GENERIC_VALIDATION_MESSAGE}`
                        );
                    }
                    return Result.fail(
                        new ReviewTargetEditorError(
                            invalid.length > 0
                                ? `Validation failed: ${invalid.join(" ")}`
                                : "Validation failed."
                        )
                    );
                }
                this.logger.error(
                    {
                        err: hasErrorSource(result.error) ? result.error.source : result.error,
                        model: params.model,
                        targetId: params.targetId
                    },
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

export const CmsEntryReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: CmsEntryReviewTargetEditorImpl,
    dependencies: [CmsEntryTargetReader, UpdateEntryUseCase, Logger]
});
