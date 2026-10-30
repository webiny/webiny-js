import { Result } from "@webiny/feature/api";
import type { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import type { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";

export const createTargetContent = (): ReviewTargetContent => {
    return {
        title: "Ann",
        fields: [
            { path: "name", label: "Name", type: "text", value: "Ann", writable: true },
            {
                path: "bio",
                label: "Bio",
                type: "long-text",
                value: "Writes about cats.",
                writable: true
            }
        ]
    };
};

/** Answers `content` to every read and records the reads; it never writes. */
export class ScriptedEditorService implements ReviewTargetEditorService.Interface {
    public readonly readCalls: ReviewTargetEditorReadParams[] = [];
    public content: Result<ReviewTargetContent, ReviewTargetEditorError> =
        Result.ok(createTargetContent());

    public async read(params: ReviewTargetEditorReadParams) {
        this.readCalls.push(params);
        return this.content;
    }

    public async update(): Promise<never> {
        throw new Error("The AI runner never writes: only a tool may.");
    }
}
