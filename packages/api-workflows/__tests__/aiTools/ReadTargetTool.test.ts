import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewGet, reviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import {
    FakeReviewTargetEditor,
    fakeEditor,
    resetFakeEditor
} from "~tests/__helpers/FakeReviewTargetEditor.js";
import { createAiToolContext } from "~tests/__helpers/aiToolContext.js";
import {
    AI_STEP_MAX_INPUT_CHARACTERS,
    READ_TARGET_TOOL_NAME
} from "~/features/aiTools/constants.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import type { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";

const setup = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.register(FakeReviewTargetEditor);
            container.registerDecorator(FailingReviewGet);
        }
    });
    const tool = context.container
        .resolve(WorkflowAiToolRegistryService)
        .get(READ_TARGET_TOOL_NAME);
    if (!tool) {
        throw new Error("The readTarget tool is not registered.");
    }
    return { tool, toolContext: createAiToolContext() };
};

/** A content whose `JSON.stringify` is exactly `length` characters long. */
const createContentOfLength = (length: number): ReviewTargetEditor.Content => {
    const empty: ReviewTargetEditor.Content = {
        title: "T",
        fields: [{ path: "body", label: "Body", type: "long-text", value: "", writable: true }]
    };
    const base = JSON.stringify(empty).length;
    return {
        ...empty,
        fields: [{ ...empty.fields[0], value: "x".repeat(length - base) }]
    };
};

describe("readTarget tool (R172, R173, R175)", () => {
    beforeEach(() => {
        resetFakeEditor();
        reviewGetFaults.mode = null;
        reviewGetFaults.reads = 0;
        loggedErrors.length = 0;
    });

    it("is named readTarget and takes no input", async () => {
        const { tool } = await setup();

        expect(tool.name).toBe("readTarget");
        expect(tool.title).toBe("Read target");
        expect(tool.inputSchema.safeParse({}).success).toBe(true);
        expect(tool.inputSchema.parse({ targetId: "forged", model: "cms.other" })).toEqual({});
    });

    it("reads the whole content with every field's path, label, type, value and writable", async () => {
        const { tool, toolContext } = await setup();

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({ ok: true, data: fakeEditor.content });
        expect(result.data).toEqual({
            title: "Article article-1",
            fields: [
                { path: "title", label: "Title", type: "text", value: "Hello", writable: true },
                {
                    path: "body",
                    label: "Body",
                    type: "long-text",
                    value: "Body text",
                    writable: true
                },
                {
                    path: "author",
                    label: "Author",
                    type: "ref",
                    value: { id: "author-1" },
                    writable: false
                }
            ]
        });
    });

    it("reads the review's own target and takes no id from the input (Review Focus 2)", async () => {
        const { tool, toolContext } = await setup();

        await tool.execute(
            {
                model: "cms.other",
                targetId: "forged-target",
                targetRevisionId: "forged-revision",
                reviewId: "forged-review"
            },
            toolContext
        );

        expect(fakeEditor.readCalls).toEqual([
            { model: "cms.article", targetId: "article-1", targetRevisionId: "article-1#0001" }
        ]);
    });

    it("reads no review and writes nothing", async () => {
        const { tool, toolContext } = await setup();

        await tool.execute({}, toolContext);

        expect(reviewGetFaults.reads).toBe(0);
        expect(fakeEditor.updateCalls).toEqual([]);
    });

    it("answers a content of exactly the input cap in full", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.content = createContentOfLength(AI_STEP_MAX_INPUT_CHARACTERS);

        const result = await tool.execute({}, toolContext);

        expect(JSON.stringify(fakeEditor.content)).toHaveLength(AI_STEP_MAX_INPUT_CHARACTERS);
        expect(result).toEqual({ ok: true, data: fakeEditor.content });
    });

    it("answers a content one character over the cap with the too-large text and no data (R175)", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.content = createContentOfLength(AI_STEP_MAX_INPUT_CHARACTERS + 1);

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({
            ok: false,
            error: "The content is too large for the AI review."
        });
        expect(result.data).toBeUndefined();
    });

    it("answers the editor's refusal text when the read fails", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.readFault = "fail";
        fakeEditor.faultMessage = "This content was not found.";

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({ ok: false, error: "This content was not found." });
        expect(loggedErrors).toEqual([]);
    });

    it("answers a fixed text and logs the real error when the editor throws (R87)", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.readFault = "throw";

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({ ok: false, error: "The target could not be read." });
        expect(JSON.stringify(result)).not.toContain("Storage threw");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("The AI tool could not read the target.");
        expect(loggedErrors[0].fields).toEqual({
            err: expect.objectContaining({ message: "Storage threw." }),
            reviewId: "review-1",
            stepId: toolContext.step.id,
            taskId: "task-1"
        });
    });

    it("answers the cannot-be-edited text for a namespace with no editor", async () => {
        const { tool, toolContext } = await setup();

        const result = await tool.execute(
            {},
            { ...toolContext, review: { ...toolContext.review, model: "wb.page" } }
        );

        expect(result).toEqual({ ok: false, error: "This target cannot be edited." });
        expect(fakeEditor.readCalls).toEqual([]);
    });
});
