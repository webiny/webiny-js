import { Result } from "@webiny/feature/api";
import { ReviewTargetEditorError } from "~/domain/review/errors.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export type FakeEditorFault = "none" | "fail" | "throw";

/** One `update` call as the fake saw it. */
export interface FakeEditorUpdateCall extends ReviewTargetEditor.UpdateParams {
    /** `WorkflowBypassService.isActive()` when `update` was entered. */
    bypassActiveAtStart: boolean;
    /** The same, after the fake awaited (the gate, or one tick): still inside the bypass scope. */
    bypassActiveAfterAwait: boolean;
    /** True once the fake got past its await, so a caller that did not await `update` shows false. */
    finished: boolean;
}

export interface FakeEditorState {
    /** What `read` answers and `update` changes. */
    content: ReviewTargetEditor.Content;
    readCalls: ReviewTargetEditor.ReadParams[];
    updateCalls: FakeEditorUpdateCall[];
    readFault: FakeEditorFault;
    updateFault: FakeEditorFault;
    /** The message of a failed `read` or `update` (`fail`). */
    faultMessage: string;
    /** When set, `update` waits for it before it answers (see `holdFakeEditorUpdate`). */
    gate: Promise<void> | null;
    /** Called when `update` was entered and recorded. */
    onUpdateStarted: (() => void) | null;
}

export const createFakeEditorContent = (): ReviewTargetEditor.Content => {
    return {
        title: "Article article-1",
        fields: [
            { path: "title", label: "Title", type: "text", value: "Hello", writable: true },
            { path: "body", label: "Body", type: "long-text", value: "Body text", writable: true },
            {
                path: "author",
                label: "Author",
                type: "ref",
                value: { id: "author-1" },
                writable: false
            }
        ]
    };
};

/** Shared by the fake and the tests. Call `resetFakeEditor()` in `beforeEach`. */
export const fakeEditor: FakeEditorState = {
    content: createFakeEditorContent(),
    readCalls: [],
    updateCalls: [],
    readFault: "none",
    updateFault: "none",
    faultMessage: 'The value of "title" is not valid.',
    gate: null,
    onUpdateStarted: null
};

export const resetFakeEditor = (): void => {
    fakeEditor.content = createFakeEditorContent();
    fakeEditor.readCalls.length = 0;
    fakeEditor.updateCalls.length = 0;
    fakeEditor.readFault = "none";
    fakeEditor.updateFault = "none";
    fakeEditor.faultMessage = 'The value of "title" is not valid.';
    fakeEditor.gate = null;
    fakeEditor.onUpdateStarted = null;
};

export interface HeldUpdate {
    /** Resolves once an `update` call was entered and is waiting. */
    started: Promise<void>;
    /** Lets the waiting `update` go on. */
    release(): void;
}

/** Holds the next `update` call in flight until `release()`, to test what happens meanwhile. */
export const holdFakeEditorUpdate = (): HeldUpdate => {
    let release: () => void = () => undefined;
    let markStarted: () => void = () => undefined;
    fakeEditor.gate = new Promise<void>(resolve => {
        release = resolve;
    });
    const started = new Promise<void>(resolve => {
        markStarted = resolve;
    });
    fakeEditor.onUpdateStarted = markStarted;
    return { started, release };
};

/** Handles "cms.article" only; serves and changes `fakeEditor.content`. */
class FakeReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(private bypass: WorkflowBypassService.Interface) {}

    public canEdit(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async read(
        params: ReviewTargetEditor.ReadParams
    ): Promise<Result<ReviewTargetEditor.Content, ReviewTargetEditorError>> {
        fakeEditor.readCalls.push(params);
        if (fakeEditor.readFault === "throw") {
            throw new Error("Storage threw.");
        }
        if (fakeEditor.readFault === "fail") {
            return Result.fail(new ReviewTargetEditorError(fakeEditor.faultMessage));
        }
        // A fresh copy, as the real editor reads: a later update never changes an earlier read.
        return Result.ok(structuredClone(fakeEditor.content));
    }

    public async update(
        params: ReviewTargetEditor.UpdateParams
    ): Promise<Result<ReviewTargetEditor.UpdateResult, ReviewTargetEditorError>> {
        const call: FakeEditorUpdateCall = {
            ...params,
            bypassActiveAtStart: this.bypass.isActive(),
            bypassActiveAfterAwait: false,
            finished: false
        };
        fakeEditor.updateCalls.push(call);
        fakeEditor.onUpdateStarted?.();
        await (fakeEditor.gate ?? Promise.resolve());
        call.bypassActiveAfterAwait = this.bypass.isActive();
        call.finished = true;

        if (fakeEditor.updateFault === "throw") {
            throw new Error("Storage threw.");
        }
        if (fakeEditor.updateFault === "fail") {
            return Result.fail(new ReviewTargetEditorError(fakeEditor.faultMessage));
        }
        // Atomic: check every path first, then apply.
        const paths = Object.keys(params.values);
        for (const path of paths) {
            const field = fakeEditor.content.fields.find(item => item.path === path);
            if (!field || !field.writable) {
                return Result.fail(
                    new ReviewTargetEditorError(`The field "${path}" cannot be written.`)
                );
            }
        }
        for (const path of paths) {
            const field = fakeEditor.content.fields.find(item => item.path === path);
            if (field) {
                field.value = params.values[path];
            }
        }
        return Result.ok({ applied: paths });
    }
}

export const FakeReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: FakeReviewTargetEditorImpl,
    dependencies: [WorkflowBypassService]
});
