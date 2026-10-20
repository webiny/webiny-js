import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { getPageReviewContext } from "./getPageReviewContext.js";
import type { ISelectedPage } from "./pageEditorDocument.js";

const editor = (isReadOnly: boolean) => ({ getEditorOptions: () => ({ isReadOnly }) });
const page = (status: ISelectedPage["status"]): ISelectedPage => ({
    id: "page-1#0001",
    title: "Home",
    status
});

describe("getPageReviewContext", () => {
    it("can request on an editable draft", () => {
        expect(getPageReviewContext(editor(false), page(WbPageStatus.Draft))).toEqual({
            targetTitle: "Home",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("cannot request when the editor is read-only", () => {
        const context = getPageReviewContext(editor(true), page(WbPageStatus.Draft));
        expect(context.canRequest).toBe(false);
    });

    it("marks a published and an unpublished page", () => {
        const published = getPageReviewContext(editor(true), page(WbPageStatus.Published));
        const unpublished = getPageReviewContext(editor(true), page(WbPageStatus.Unpublished));

        expect(published.isPublished).toBe(true);
        expect(published.isUnpublished).toBe(false);
        expect(unpublished.isPublished).toBe(false);
        expect(unpublished.isUnpublished).toBe(true);
    });
});
