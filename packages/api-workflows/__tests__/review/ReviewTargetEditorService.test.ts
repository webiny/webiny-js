import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, expectOk } from "~tests/__helpers/fixtures.js";
import {
    FakeReviewTargetEditor,
    fakeEditor,
    resetFakeEditor
} from "~tests/__helpers/FakeReviewTargetEditor.js";
import { ReviewTargetEditorError } from "~/domain/review/errors.js";
import { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";

const READ_PARAMS: ReviewTargetEditor.ReadParams = {
    model: ARTICLE_MODEL,
    targetId: "article-1",
    targetRevisionId: "article-1#0001"
};

const UPDATE_PARAMS: ReviewTargetEditor.UpdateParams = {
    ...READ_PARAMS,
    values: { title: "New title" }
};

/** A second editor for the same namespace, registered after the fake: the last match wins. */
class SecondEditorImpl implements ReviewTargetEditor.Interface {
    public canEdit(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async read(): Promise<Result<ReviewTargetEditor.Content, ReviewTargetEditorError>> {
        return Result.ok({ title: "Second editor", fields: [] });
    }

    public async update(): Promise<
        Result<ReviewTargetEditor.UpdateResult, ReviewTargetEditorError>
    > {
        return Result.ok({ applied: ["second"] });
    }
}

const SecondEditor = ReviewTargetEditor.createImplementation({
    implementation: SecondEditorImpl,
    dependencies: []
});

/** An editor for another namespace, registered after the fake: it must not be picked for articles. */
class PageEditorImpl implements ReviewTargetEditor.Interface {
    public canEdit(model: string): boolean {
        return model === "wb.page";
    }

    public async read(): Promise<Result<ReviewTargetEditor.Content, ReviewTargetEditorError>> {
        return Result.ok({ title: "Page editor", fields: [] });
    }

    public async update(): Promise<
        Result<ReviewTargetEditor.UpdateResult, ReviewTargetEditorError>
    > {
        return Result.ok({ applied: ["page"] });
    }
}

const PageEditor = ReviewTargetEditor.createImplementation({
    implementation: PageEditorImpl,
    dependencies: []
});

const createService = async (
    register: Array<typeof FakeReviewTargetEditor | typeof SecondEditor | typeof PageEditor> = []
) => {
    const { context } = await createContextHandler({
        setup: container => {
            for (const implementation of register) {
                container.register(implementation as typeof FakeReviewTargetEditor);
            }
        }
    });
    return context.container.resolve(ReviewTargetEditorService);
};

describe("ReviewTargetEditorError (R172)", () => {
    it("has its own code and carries the message it is given", () => {
        const error = new ReviewTargetEditorError('The field "title" cannot be written.');

        expect(error.code).toBe("Workflows/ReviewTarget/EditorError");
        expect(error.message).toBe('The field "title" cannot be written.');
    });
});

describe("ReviewTargetEditorService (spec 9.3, R172)", () => {
    beforeEach(() => {
        resetFakeEditor();
    });

    it("reads through the editor that handles the namespace", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const content = expectOk(await service.read(READ_PARAMS));

        expect(content).toEqual(fakeEditor.content);
        expect(content.fields.map(field => [field.path, field.writable])).toEqual([
            ["title", true],
            ["body", true],
            ["author", false]
        ]);
        expect(fakeEditor.readCalls).toEqual([READ_PARAMS]);
    });

    it("updates through the editor that handles the namespace and returns the applied paths", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const result = expectOk(await service.update(UPDATE_PARAMS));

        expect(result).toEqual({ applied: ["title"] });
        expect(fakeEditor.updateCalls).toHaveLength(1);
        expect(fakeEditor.updateCalls[0]).toMatchObject(UPDATE_PARAMS);
        expect(fakeEditor.content.fields[0].value).toBe("New title");
    });

    it("fails with a message safe for the model when no editor handles the namespace", async () => {
        const service = await createService();

        const read = await service.read(READ_PARAMS);
        const update = await service.update(UPDATE_PARAMS);

        expect(read.error).toBeInstanceOf(ReviewTargetEditorError);
        expect(read.error.message).toBe("This target cannot be edited.");
        expect(update.error).toBeInstanceOf(ReviewTargetEditorError);
        expect(update.error.message).toBe("This target cannot be edited.");
    });

    it("fails for a namespace its editors do not handle, without calling them", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const read = await service.read({ ...READ_PARAMS, model: "cms.other" });
        const update = await service.update({ ...UPDATE_PARAMS, model: "cms.other" });

        expect(read.error.message).toBe("This target cannot be edited.");
        expect(update.error.message).toBe("This target cannot be edited.");
        expect(fakeEditor.readCalls).toEqual([]);
        expect(fakeEditor.updateCalls).toEqual([]);
    });

    it("picks the last registered editor that handles the namespace", async () => {
        const service = await createService([FakeReviewTargetEditor, SecondEditor]);

        const content = expectOk(await service.read(READ_PARAMS));
        const result = expectOk(await service.update(UPDATE_PARAMS));

        expect(content.title).toBe("Second editor");
        expect(result).toEqual({ applied: ["second"] });
        expect(fakeEditor.readCalls).toEqual([]);
        expect(fakeEditor.updateCalls).toEqual([]);
    });

    it("skips a later editor that does not handle the namespace", async () => {
        const service = await createService([FakeReviewTargetEditor, PageEditor]);

        const article = expectOk(await service.read(READ_PARAMS));
        const page = expectOk(await service.read({ ...READ_PARAMS, model: "wb.page" }));

        expect(article.title).toBe("Article article-1");
        expect(page.title).toBe("Page editor");
    });

    it("returns the editor's refusal unchanged", async () => {
        const service = await createService([FakeReviewTargetEditor]);

        const result = await service.update({ ...UPDATE_PARAMS, values: { author: "x" } });

        expect(result.error).toBeInstanceOf(ReviewTargetEditorError);
        expect(result.error.message).toBe('The field "author" cannot be written.');
        expect(fakeEditor.content.fields[2].value).toEqual({ id: "author-1" });
    });
});
