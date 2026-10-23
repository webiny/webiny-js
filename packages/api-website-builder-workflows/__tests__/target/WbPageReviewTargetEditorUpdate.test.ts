import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    mismatchedTargetRevisions,
    nullTargetRevisions,
    scriptTargetReads,
    targetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { malformedWbPageTargetReader } from "~tests/__helpers/MalformedWbPageTargetReader.js";
import { failUpdatePage, updatePageFaults } from "~tests/__helpers/FailingUpdatePage.js";
import { createRichPage, RICH_PROPERTIES } from "~tests/__helpers/richPages.js";
import { createPage } from "~tests/__helpers/pages.js";
import { readPage, requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { NOBODY, READER, WB_READER } from "~tests/__helpers/identities.js";

const createEditorContext = (legacyPlugins: unknown[] = []) => {
    return createUserContext({ legacyPlugins: [captureLoggedErrors, ...legacyPlugins] });
};

const getEditor = (context: CmsContext): ReviewTargetEditor.Interface => {
    return context.container.resolveAll(ReviewTargetEditor).find(item => item.canEdit("wb.page"))!;
};

const update = (
    context: CmsContext,
    page: WbPage,
    values: Record<string, unknown>,
    targetId: string = page.entryId
) => {
    return getEditor(context).update({
        model: "wb.page",
        targetId,
        targetRevisionId: page.id,
        values
    });
};

/** The stored `properties` of a page revision. */
const readProperties = async (context: CmsContext, page: WbPage) => {
    return (await readPage(context, page.id)).values.properties as Record<string, unknown>;
};

beforeEach(() => {
    loggedErrors.length = 0;
    updatePageFaults.throwing = false;
    updatePageFaults.validation = false;
});

afterEach(() => {
    throwingAccessChecks.clear();
    throwingTargetRevisions.clear();
    nullTargetRevisions.clear();
    mismatchedTargetRevisions.clear();
});

describe("WbPageReviewTargetEditor.update", () => {
    it("writes the title and the five SEO scalars and returns the applied paths in input order", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        const result = await update(context, page, {
            "properties.seo.noIndex": true,
            "properties.title": "New home",
            "properties.seo.title": "New home | Acme",
            "properties.seo.description": "The new home page.",
            "properties.seo.canonicalUrl": "/new-home",
            "properties.seo.noFollow": true
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            applied: [
                "properties.seo.noIndex",
                "properties.title",
                "properties.seo.title",
                "properties.seo.description",
                "properties.seo.canonicalUrl",
                "properties.seo.noFollow"
            ]
        });
        const properties = await readProperties(context, page);
        expect(properties.title).toBe("New home");
        expect(properties.seo).toMatchObject({
            title: "New home | Acme",
            description: "The new home page.",
            canonicalUrl: "/new-home",
            noIndex: true,
            noFollow: true
        });
    });

    it("keeps properties.path and properties.language unchanged after an update (Review Focus 3)", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        const result = await update(context, page, {
            "properties.title": "New home",
            "properties.seo.title": "New home | Acme"
        });

        expect(result.isOk()).toBe(true);
        const properties = await readProperties(context, page);
        expect(properties.path).toBe(page.properties.path);
        expect(properties.language).toBe("en");
    });

    it("preserves every other properties key: the full merged properties is written, nothing is wiped", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        await update(context, page, {
            "properties.title": "New home",
            "properties.seo.description": "New description"
        });

        const properties = await readProperties(context, page);
        expect(properties.snippet).toBe(RICH_PROPERTIES.snippet);
        expect(properties.tags).toEqual(RICH_PROPERTIES.tags);
        expect(properties.image).toEqual(RICH_PROPERTIES.image);
        expect(properties.social).toEqual(RICH_PROPERTIES.social);
        expect(properties.seo).toEqual({
            ...RICH_PROPERTIES.seo,
            description: "New description"
        });
        expect(Object.keys(properties).sort()).toEqual(Object.keys(page.properties).sort());
    });

    it("never writes the element tree, bindings, metadata, extensions or location", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);
        const before = await readPage(context, page.id);

        const result = await update(context, page, { "properties.title": "New home" });

        expect(result.isOk()).toBe(true);
        const after = await readPage(context, page.id);
        expect(after.values.elements).toEqual(before.values.elements);
        expect(after.values.bindings).toEqual(before.values.bindings);
        expect(after.values.metadata).toEqual(before.values.metadata);
        expect(after.values.extensions).toEqual(before.values.extensions);
        expect(after.location).toEqual(before.location);
    });

    it("creates the seo object that the page does not have yet and keeps the other keys", async () => {
        const context = await createEditorContext();
        const page = await createPage(context, { title: "Plain" });

        const result = await update(context, page, { "properties.seo.title": "Plain | Acme" });

        expect(result.isOk()).toBe(true);
        const properties = await readProperties(context, page);
        expect(properties.seo).toEqual({ title: "Plain | Acme" });
        expect(properties.title).toBe("Plain");
        expect(properties.path).toBe(page.properties.path);
    });

    it("clears an SEO text field with null by removing its key, and keeps the rest of seo", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);

        const result = await update(context, page, { "properties.seo.description": null });

        expect(result.isOk()).toBe(true);
        const properties = await readProperties(context, page);
        expect(properties.seo).toEqual({
            title: RICH_PROPERTIES.seo.title,
            metaTags: RICH_PROPERTIES.seo.metaTags,
            canonicalUrl: RICH_PROPERTIES.seo.canonicalUrl,
            noIndex: false,
            noFollow: false,
            structuredSchema: "{}"
        });
    });

    it("rejects an unknown path, naming it, and writes nothing (atomic)", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);
        const before = await readProperties(context, page);

        const result = await update(context, page, {
            "properties.title": "Changed",
            "properties.nickname": "Home"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/ReviewTarget/EditorError");
        expect(result.error.message).toBe(
            'Unknown field "properties.nickname". Use the paths returned by readTarget.'
        );
        expect(await readProperties(context, page)).toEqual(before);
        expect(loggedErrors).toEqual([]);
    });

    it("rejects the path of an object, undefined nested paths and prototype keys", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);
        const before = await readProperties(context, page);

        const seo = await update(context, page, { "properties.seo": { title: "x" } });
        const nested = await update(context, page, { "properties.social.title": "x" });
        const missing = await update(context, page, { "properties.seo.nope": "x" });
        const proto = await update(
            context,
            page,
            JSON.parse('{ "__proto__": { "polluted": true } }')
        );
        const constructorKey = await update(context, page, { "constructor.prototype.x": 1 });

        for (const result of [seo, nested, missing, proto, constructorKey]) {
            expect(result.isFail()).toBe(true);
            expect(result.error.message).toMatch(/^Unknown field /);
        }
        expect(seo.error.message).toContain('"properties.seo"');
        expect(nested.error.message).toContain('"properties.social.title"');
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(await readProperties(context, page)).toEqual(before);
    });

    it("rejects every path outside the allowlist as read-only and writes nothing (R172)", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);
        const before = await readPage(context, page.id);
        const readOnly = [
            "properties.path",
            "properties.language",
            "properties.snippet",
            "properties.tags",
            "properties.image",
            "properties.social",
            "properties.seo.metaTags",
            "properties.seo.structuredSchema",
            "location",
            "status",
            "metadata",
            "bindings",
            "extensions",
            "elements"
        ];

        for (const path of readOnly) {
            const result = await update(context, page, { [path]: "x" });

            expect(result.isFail()).toBe(true);
            expect(result.error.message).toBe(`The field "${path}" is read-only.`);
        }
        const after = await readPage(context, page.id);
        expect(after.values).toEqual(before.values);
        expect(after.location).toEqual(before.location);
    });

    it("reports every bad path in one error and writes none of the good ones", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);
        const before = await readProperties(context, page);

        const result = await update(context, page, {
            "properties.title": "Changed",
            "properties.path": "/hijacked",
            "properties.nickname": "Home",
            "properties.seo.noIndex": "yes"
        });

        expect(result.error.message).toBe(
            [
                'The field "properties.path" is read-only.',
                'Unknown field "properties.nickname". Use the paths returned by readTarget.',
                'The field "properties.seo.noIndex" expects true or false.'
            ].join(" ")
        );
        expect(await readProperties(context, page)).toEqual(before);
    });

    it("rejects a value of the wrong type for every writable path", async () => {
        const context = await createEditorContext();
        const page = await createRichPage(context);
        const before = await readProperties(context, page);

        const results = await Promise.all([
            update(context, page, { "properties.title": 5 }),
            update(context, page, { "properties.title": "   " }),
            update(context, page, { "properties.title": null }),
            update(context, page, { "properties.seo.title": 5 }),
            update(context, page, { "properties.seo.description": ["x"] }),
            update(context, page, { "properties.seo.canonicalUrl": false }),
            update(context, page, { "properties.seo.canonicalUrl": "https://example.com/x" }),
            update(context, page, { "properties.seo.noIndex": "true" }),
            update(context, page, { "properties.seo.noFollow": null })
        ]);

        expect(results.map(item => item.error.message)).toEqual([
            'The field "properties.title" expects a non-empty string.',
            'The field "properties.title" expects a non-empty string.',
            'The field "properties.title" expects a non-empty string.',
            'The field "properties.seo.title" expects a string or null.',
            'The field "properties.seo.description" expects a string or null.',
            'The field "properties.seo.canonicalUrl" expects a pathname such as /path, or null.',
            'The field "properties.seo.canonicalUrl" expects a pathname such as /path, or null.',
            'The field "properties.seo.noIndex" expects true or false.',
            'The field "properties.seo.noFollow" expects true or false.'
        ]);
        expect(await readProperties(context, page)).toEqual(before);
    });

    it("fails for no fields without reading or writing the target", async () => {
        const context = await createEditorContext([scriptTargetReads]);
        const page = await createRichPage(context);
        targetReads.length = 0;

        const result = await update(context, page, {});

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("No fields were given.");
        expect(targetReads).toEqual([]);
    });

    it("fails for a missing revision and for a revision of another page", async () => {
        const context = await createEditorContext([scriptTargetReads]);
        const page = await createRichPage(context);
        const other = await createRichPage(context);
        nullTargetRevisions.add(other.id);
        mismatchedTargetRevisions.add(page.id);
        const before = await readProperties(context, page);

        const missing = await update(context, other, { "properties.title": "Changed" });
        const mismatched = await update(
            context,
            page,
            { "properties.title": "Changed" },
            other.entryId
        );

        expect(missing.error.message).toBe("The target was not found.");
        expect(mismatched.error.message).toBe("The target was not found.");
        expect(await readProperties(context, page)).toEqual(before);
    });

    it("logs a throwing reader and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createEditorContext([scriptTargetReads]);
        const page = await createRichPage(context);
        throwingTargetRevisions.add(page.id);

        const result = await update(context, page, { "properties.title": "Changed" });
        throwingTargetRevisions.clear();

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect((await readProperties(context, page)).title).toBe("Home");
    });

    it("logs a throwing read access check and fails with a generic text, writing nothing (R87)", async () => {
        const context = await createEditorContext([throwOnAccessChecks]);
        const page = await createRichPage(context);
        const before = await readProperties(context, page);
        throwingAccessChecks.add("canRead");

        const result = await update(context, page, { "properties.title": "Changed" });
        throwingAccessChecks.clear();

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect(await readProperties(context, page)).toEqual(before);
    });

    it("fails with a generic text and one log for a malformed page instead of rejecting (R87)", async () => {
        const context = await createEditorContext([malformedWbPageTargetReader]);
        const page = await createRichPage(context);

        const result = await update(context, page, { "properties.title": "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect((await readProperties(context, page)).title).toBe("Home");
    });

    it("logs a throwing update and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createEditorContext([failUpdatePage]);
        const page = await createRichPage(context);
        updatePageFaults.throwing = true;

        const result = await update(context, page, { "properties.title": "Changed" });
        updatePageFaults.throwing = false;

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be updated.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not update the target from the AI editor.");
        expect(loggedErrors[0].fields).toMatchObject({ model: "wb.page", targetId: page.entryId });
        expect((await readProperties(context, page)).title).toBe("Home");
    });

    it("hides the text of a failed Result behind a generic text and logs the raw error (R87)", async () => {
        const context = await createEditorContext([failUpdatePage]);
        const page = await createRichPage(context);
        updatePageFaults.validation = true;

        const result = await update(context, page, { "properties.title": "Changed" });
        updatePageFaults.validation = false;

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be updated.");
        expect(result.error.message).not.toContain("ECONNREFUSED");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].fields).toMatchObject({
            err: { code: "WebsiteBuilder/Page/ValidationError" }
        });
    });

    it("does not widen access: a user who can read but not write the page cannot write (generic text, logged)", async () => {
        const admin = await createEditorContext();
        const page = await createRichPage(admin);
        const reader = await createUserContext({
            identity: READER,
            permissions: WB_READER,
            legacyPlugins: [captureLoggedErrors]
        });

        const result = await update(reader, page, { "properties.title": "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be updated.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].fields).toMatchObject({
            err: { code: "WebsiteBuilder/Page/NotAuthorized" }
        });
        expect((await readProperties(admin, page)).title).toBe("Home");
    });

    it("treats a page the user cannot read as not found, without a log", async () => {
        const admin = await createEditorContext();
        const page = await createRichPage(admin);
        const nobody = await createUserContext({
            identity: NOBODY,
            permissions: [],
            legacyPlugins: [captureLoggedErrors]
        });

        const result = await update(nobody, page, { "properties.title": "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target was not found.");
        expect(loggedErrors).toEqual([]);
        expect((await readProperties(admin, page)).title).toBe("Home");
    });

    it("is blocked by the save block of a revision under review unless the bypass is active (R173)", async () => {
        const context = await createEditorContext();
        await storeWbWorkflow(context);
        const page = await createRichPage(context);
        const review = await requestPageReview(context, page);
        const bypass = context.container.resolve(WorkflowBypassService);

        const outside = await update(context, page, { "properties.title": "Outside" });
        const inside = await bypass.run(() =>
            update(context, page, { "properties.title": "Inside" })
        );
        const after = await update(context, page, { "properties.title": "After" });

        expect(outside.isFail()).toBe(true);
        expect(outside.error.message).toBe("The target could not be updated.");
        expect(loggedErrors[0].fields).toMatchObject({
            err: {
                message: new ReviewTargetLockedError({
                    reviewId: review.id,
                    model: "wb.page",
                    targetRevisionId: page.id,
                    reviewState: "inProgress",
                    action: "update"
                }).message
            }
        });
        expect(inside.isOk()).toBe(true);
        expect((await readProperties(context, page)).title).toBe("Inside");
        expect(after.isFail()).toBe(true);
        expect(bypass.isActive()).toBe(false);
    });

    it("a bypassed write changes the properties only: the review stays in progress and the bypass is closed after", async () => {
        const context = await createEditorContext();
        await storeWbWorkflow(context);
        const page = await createRichPage(context);
        await requestPageReview(context, page);
        const bypass = context.container.resolve(WorkflowBypassService);

        const result = await bypass.run(() =>
            update(context, page, { "properties.seo.title": "Edited by AI" })
        );

        expect(result.isOk()).toBe(true);
        expect((await readPage(context, page.id)).system?.workflow?.reviewState).toBe("inProgress");
        expect(bypass.isActive()).toBe(false);
    });
});
