import { Result } from "@webiny/feature/api";
import { ReviewTargetEditorError } from "~/domain/review/errors.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorService as ReviewTargetEditorServiceAbstraction } from "./abstractions.js";

class ReviewTargetEditorServiceImpl implements ReviewTargetEditorServiceAbstraction.Interface {
    public constructor(private editors: ReviewTargetEditor.Interface[]) {}

    public async read(params: ReviewTargetEditor.ReadParams) {
        // Several editors may match (a generic one and a specific one); the last registered wins,
        // the same rule as `ReviewTargetLoader` in `RequestReviewUseCase`.
        const editor = [...this.editors].reverse().find(item => item.canEdit(params.model));
        if (!editor) {
            return Result.fail(new ReviewTargetEditorError("This target cannot be edited."));
        }
        return editor.read(params);
    }

    public async update(params: ReviewTargetEditor.UpdateParams) {
        const editor = [...this.editors].reverse().find(item => item.canEdit(params.model));
        if (!editor) {
            return Result.fail(new ReviewTargetEditorError("This target cannot be edited."));
        }
        return editor.update(params);
    }
}

export const ReviewTargetEditorService = ReviewTargetEditorServiceAbstraction.createImplementation({
    implementation: ReviewTargetEditorServiceImpl,
    dependencies: [[ReviewTargetEditor, { multiple: true }]]
});
