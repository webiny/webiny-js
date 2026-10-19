import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    mismatchedTargetRevisions,
    nullTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { malformedWbPageTargetReader } from "~tests/__helpers/MalformedWbPageTargetReader.js";
import { createRichPage, RICH_PROPERTIES } from "~tests/__helpers/richPages.js";
import { createPage } from "~tests/__helpers/pages.js";
import { NOBODY, READER, WB_READER } from "~tests/__helpers/identities.js";

const createEditorContext = (legacyPlugins: unknown[] = []) => {
    return createUserContext({ legacyPlugins: [captureLoggedErrors, ...legacyPlugins] });
};

const getEditor = (context: CmsContext): ReviewTargetEditor.Interface => {
    return context.container.resolveAll(ReviewTargetEditor).find(item => item.canEdit("wb.page"))!;
};

beforeEach(() => {
    loggedErrors.length = 0;
});

afterEach(() => {
    throwingAccessChecks.clear();
    throwingTargetRevisions.clear();
    nullTargetRevisions.clear();
    mismatchedTargetRevisions.clear();
});

describe("WbPageReviewTargetEditor.read", () => {
    it("claims the wb.page namespace only", async () => {
        const context = await createEditorContext();
        const editors = context.container.resolveAll(ReviewTargetEditor);

        expect(editors.filter(item => item.canEdit("wb.page"))).toHaveLength(1);
        expect(editors.some(item => item.canEdit("wb.pages"))).toBe(false);
        expect(editors.some(item => item.canEdit("page"))).toBe(false);
    });

    it("reads the title and the page except the element tree, with writability (R172)", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        expect(result.isOk()).toBe(true);
        const content = result.value;
        expect(content.title).toBe("Home");
        // The order of the stored keys is the store's business; the set and the verdicts are not.
        expect(content.fields.map(item => [item.path, item.writable]).sort()).toEqual(
            [
                ["properties.title", true],
                ["properties.path", false],
                ["properties.language", false],
                ["properties.snippet", false],
                ["properties.tags", false],
                ["properties.image", false],
                ["properties.social", false],
                ["properties.seo.title", true],
                ["properties.seo.description", true],
                ["properties.seo.canonicalUrl", true],
                ["properties.seo.noIndex", true],
                ["properties.seo.noFollow", true],
                ["properties.seo.metaTags", false],
                ["properties.seo.structuredSchema", false],
                ["location", false],
                ["status", false],
                ["metadata", false],
                ["bindings", false],
                ["extensions", false],
                ["elements", false]
            ].sort()
        );
        const byPath = Object.fromEntries(content.fields.map(item => [item.path, item]));
        expect(byPath["properties.title"]).toEqual({
            path: "properties.title",
            label: "Page title",
            type: "text",
            value: "Home",
            writable: true
        });
        expect(byPath["properties.path"].value).toBe(page.properties.path);
        expect(byPath["properties.language"].value).toBe("en");
        expect(byPath["properties.seo.title"].value).toBe("Home | Acme");
        expect(byPath["properties.seo.noIndex"].value).toBe(false);
        expect(byPath["properties.seo.metaTags"].value).toEqual(RICH_PROPERTIES.seo.metaTags);
        expect(byPath["properties.social"].value).toEqual(RICH_PROPERTIES.social);
        expect(byPath["properties.tags"].value).toEqual(["news", "launch"]);
        expect(byPath.location.value).toEqual({ folderId: "root" });
        expect(byPath.metadata.value).toEqual({ notes: "Draft." });
        expect(byPath.bindings.value).toEqual({ text1: { inputs: { text: { static: "Hello" } } } });
    });

    it("gives the model JSON-safe values only: no Date objects in any row", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        expect(JSON.parse(JSON.stringify(result.value.fields))).toEqual(result.value.fields);
    });

    it("reads the element tree as a summary, not the tree", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        const elements = result.value.fields.find(item => item.path === "elements");
        expect(elements).toMatchObject({
            type: "object",
            writable: false,
            value: { count: 3, components: { "Webiny/Box": 1, "Webiny/Text": 2 } }
        });
    });

    it("reads missing SEO values as null and still marks the rows writable", async () => {
        const context = await createEditorContext();
        const page = await createPage(context, { title: "Plain" });

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        const seo = result.value.fields.filter(item => item.path.startsWith("properties.seo."));
        expect(seo.map(item => [item.path, item.value, item.writable])).toEqual([
            ["properties.seo.title", null, true],
            ["properties.seo.description", null, true],
            ["properties.seo.canonicalUrl", null, true],
            ["properties.seo.noIndex", null, true],
            ["properties.seo.noFollow", null, true]
        ]);
    });

    it("fails for a missing revision, a revision of another page and another namespace", async () => {
        const context = await createEditorContext([scriptTargetReads]);
        const page = await createRichPage(context);
        const other = await createRichPage(context);
        const editor = getEditor(context);
        nullTargetRevisions.add(other.id);
        mismatchedTargetRevisions.add(page.id);

        const missing = await editor.read({
            model: "wb.page",
            targetId: other.entryId,
            targetRevisionId: other.id
        });
        const mismatched = await editor.read({
            model: "wb.page",
            targetId: other.entryId,
            targetRevisionId: page.id
        });
        const elsewhere = await editor.read({
            model: "cms.article",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        for (const result of [missing, mismatched, elsewhere]) {
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Workflows/ReviewTarget/EditorError");
            expect(result.error.message).toBe("The target was not found.");
        }
        expect(loggedErrors).toEqual([]);
    });

    it("reads as the request identity: a user who cannot read pages gets nothing", async () => {
        const admin = await createEditorContext();
        const page = await createRichPage(admin);
        const reader = await createUserContext({ identity: READER, permissions: WB_READER });
        const nobody = await createUserContext({ identity: NOBODY, permissions: [] });
        const params = { model: "wb.page", targetId: page.entryId, targetRevisionId: page.id };

        const asReader = await getEditor(reader).read(params);
        const asNobody = await getEditor(nobody).read(params);

        expect(asReader.isOk()).toBe(true);
        expect(asReader.value.title).toBe("Home");
        expect(asNobody.isFail()).toBe(true);
        expect(asNobody.error.message).toBe("The target was not found.");
    });

    it("logs a throwing reader and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createEditorContext([scriptTargetReads]);
        const page = await createRichPage(context);
        throwingTargetRevisions.add(page.id);

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect(loggedErrors[0].fields).toMatchObject({ model: "wb.page", targetId: page.entryId });
    });

    it("logs a throwing read access check and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createEditorContext([throwOnAccessChecks]);
        const page = await createRichPage(context);
        throwingAccessChecks.add("canRead");

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });
        throwingAccessChecks.clear();

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect(loggedErrors[0].fields).toMatchObject({ model: "wb.page", targetId: page.entryId });
    });

    it("fails with a generic text and one log for a malformed page instead of rejecting (R87)", async () => {
        const context = await createEditorContext([malformedWbPageTargetReader]);
        const page = await createRichPage(context);

        const result = await getEditor(context).read({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
    });
});
