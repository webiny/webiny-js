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
    status,
    createdById: null
});

describe("getPageReviewContext", () => {
    it("can request on an editable draft", () => {
        expect(getPageReviewContext(editor(false), page(WbPageStatus.Draft), true)).toEqual({
            targetTitle: "Home",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("cannot request when the editor is read-only", () => {
        const context = getPageReviewContext(editor(true), page(WbPageStatus.Draft), true);
        expect(context.canRequest).toBe(false);
    });

    it("cannot request without the permission to edit the page", () => {
        const context = getPageReviewContext(editor(false), page(WbPageStatus.Draft), false);
        expect(context.canRequest).toBe(false);
    });

    it("marks a published and an unpublished page", () => {
        const published = getPageReviewContext(editor(true), page(WbPageStatus.Published), true);
        const unpublished = getPageReviewContext(
            editor(true),
            page(WbPageStatus.Unpublished),
            true
        );

        expect(published.isPublished).toBe(true);
        expect(published.isUnpublished).toBe(false);
        expect(unpublished.isPublished).toBe(false);
        expect(unpublished.isUnpublished).toBe(true);
    });
});
