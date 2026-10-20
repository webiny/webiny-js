### Task 13: WB editor `read` and `update`

Spec 9.3; D36, D55, D62; R87, R150, R172, R173; SEC-66; Review Focus 3. The `wb.page` adapter of the `ReviewTargetEditor` port (Task 9) in `packages/api-website-builder-workflows`. Mirrors Tasks 11 and 12 (same port, same failure handling), adapted to pages. Behaviour:

- `features/target/WbPageReviewTargetEditor.ts` (flat file in `features/target/`, like `WbPageReviewTargetLoader.ts`; no barrel). `canEdit(model)` is `model === WB_PAGE_NAMESPACE`. Registered in `target/feature.ts` next to the other page ports, so it sits under the same licence gate (`WbTargetFeature`; the editor adds no flag of its own, the AI step type is what is gated, R177).
- **Reading (the whole page except the element tree, summarized).** `read({ model, targetId, targetRevisionId })` loads the page through `WbPageTargetReader` (the page model is private and read as the current identity, the revision without entry checks) and then asks `WbPageAccess.canRead(target)` as the request identity (SEC-66; in production the AI run is attributed to the requester with authorization off, R161, so the check passes there, and the target id comes from the stored review snapshot, never from the model). It returns `Result.ok({ title, fields })`. `title` is `page.properties.title`. `fields` is `toWbPageEditorFields(page)` (pure), in this order:
  - `properties.title` (`text`, writable).
  - Every other key of `properties` except `seo` as one read-only row `properties.<key>` with the whole value (`path`, `language`, `snippet`, `tags`, `image`, `social`, `sourcePage` and anything custom). `properties.path` and `properties.language` are always read-only. A key that contains a dot is skipped (it could shadow an allowlisted path).
  - The five SEO scalars, writable, in this order: `properties.seo.title` (`text`), `properties.seo.description` (`long-text`), `properties.seo.canonicalUrl` (`text`), `properties.seo.noIndex` (`boolean`), `properties.seo.noFollow` (`boolean`); a missing value reads as `null`.
  - Every other key of `properties.seo` (`metaTags`, `structuredSchema`) as a read-only row `properties.seo.<key>`.
  - Read-only rows `location`, `status`, `metadata`, `bindings`, `extensions` (whole value, `null` when missing) and `elements`, whose value is a summary `{ count, components }` (`components` maps a component name to how many elements use it), not the element tree (R172, so a large page does not hit the input cap just because of its tree). In short: the whole page except the element tree (summary). Everything else stays in full, `bindings` included: an oversized page fails through Task 10's fixed over-cap path (`AI_STEP_CONTENT_TOO_LARGE_MESSAGE`), with no truncation.
  - Every row carries `path`, `label`, `type` (the SEO and title rows use the field type above; a read-only row uses `text`, `number`, `boolean`, `list`, `object` or `null` from the JavaScript value), `value` (`null` when missing) and `writable`.
- **Writing (explicit allowlist, R172).** Only `properties.title` and `properties.seo.{title,description,canonicalUrl,noIndex,noFollow}` are writable (the General and SEO groups of the page editor; `properties.seo.metaTags`, `properties.social`, `properties.image`, `properties.tags`, `properties.path`, `properties.language` and everything else are read-only). `update({ model, targetId, targetRevisionId, values })`, in this order:
  1. **Input.** No keys: `ReviewTargetEditorError("No fields were given.")`, nothing read or written. The applied list is `Object.keys(values)` in input order.
  2. **Target.** The page is read again (reader plus `canRead`, as the request identity): a missing revision, one of another page, or one the identity cannot read fails with `The target was not found.`; a throwing reader or access check, or a malformed page (`toWbPageEditorFields` or the title read throwing), is logged (`Could not read the target for the AI editor.`) and fails with `The target could not be read.` (R87).
  3. **Path rules.** Every key is looked up in a `Map` built from `toWbPageEditorFields(page)` (never by indexing `values`, so `__proto__` is a plain unknown key). Not a row: `Unknown field "<path>". Use the paths returned by readTarget.` (this includes `properties.seo`, `properties.social.title` and `properties.nope`); a read-only row: `The field "<path>" is read-only.`; a value of the wrong type: `The field "<path>" expects <description>.` (`isWbPageEditorValue`: `properties.title` a non-empty string, `null` not accepted; `properties.seo.title` and `.description` a string or `null`; `properties.seo.canonicalUrl` a pathname such as `/path` (the admin SEO group's rule, plus `//host` rejected on top; an external URL and `javascript:` fail the leading `/`) or `null`; `null` removes the key; `noIndex` and `noFollow` a boolean). All problems are collected and returned in one error (joined with a space). Nothing is written when there is any problem (atomic).
  4. **Merge.** `toWbPageProperties(page.properties, values)` returns the FULL merged `properties` object: a copy of the current `properties` with the written keys set, and a copy of `seo` (a missing or non-object `seo` is created) when any SEO key is written. The page update replaces `properties` as a whole (the CMS update merges top-level keys only), so a partial blob would wipe `path`, `language`, `social`, `seo.metaTags` and every other key. The current values are never mutated.
  5. **Write.** One `UpdatePageUseCase.execute(targetRevisionId, { properties: merged })` call: `properties` only, so `elements`, `bindings`, `metadata`, `extensions` and `location` are not in the update. The bypass is already active around this call (R173, `updateTargetFields` wraps `update` in `WorkflowBypassService.run`); this class neither reads nor sets it and adds no authorization switch: the write runs with the identity and authorization state of the task (requester, authorization off, R161). Success returns `{ applied }`. The page is read and written in two calls (a read-modify-write window like the tool re-guard, A59); a concurrent edit to ANY `properties` key in that window (`path`, `social`, and so on, not only the written keys) is lost, because the whole merged `properties` is written back; this is acceptable under the save block (A59), since a revision under review is save-blocked for users anyway.
  6. **Failures (R87).** The page model has no validators on `properties` (a JSON field), and the page use case wraps CMS messages (`PageValidationError`, `PagePersistenceError` keep the raw text), so no use case message is ever forwarded to the model: every failed Result (not authorized, not found, locked or blocked revision, validation, persistence, `TargetLocked` from the save block outside the bypass) is logged with `Logger.error({ error, model, targetId }, "Could not update the target from the AI editor.")` and returns `ReviewTargetEditorError("The target could not be updated.")`. A throwing use case is handled the same way. The method never rejects (the reads, the patch building and the write each run inside a `try`).

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/target/toWbPageEditorFields.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/isWbPageEditorValue.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/toWbPageProperties.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetEditor.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/feature.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/richPages.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FailingUpdatePage.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/MalformedWbPageTargetReader.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/toWbPageEditorFields.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/isWbPageEditorValue.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/toWbPageProperties.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorUpdate.test.ts`

**Interfaces:**
- Consumes:
  - Task 9 (`@webiny/api-workflows`): `ReviewTargetEditor` (`features/review/ReviewTargetEditor/index.js`; `createImplementation`, `Interface`), the interfaces `ReviewTargetEditorField`, `ReviewTargetContent`, `ReviewTargetEditorReadParams`, `ReviewTargetEditorUpdateParams`, `ReviewTargetEditorUpdateResult` (`features/review/ReviewTargetEditor/abstractions.js`, named exactly as in the contract) and `ReviewTargetEditorError` (`domain/review/errors.js`, `new ReviewTargetEditorError(message: string)`, code `Workflows/ReviewTarget/EditorError`).
  - Task 11 (`@webiny/api-headless-cms-workflows`): `CmsEntryReviewTargetEditor`, registered by `CmsTargetFeature`; the test handler may register both packages, but this task's tests assert only the WB editor (6.7 stays independent of 6.6): they filter `resolveAll(ReviewTargetEditor)` by `canEdit("wb.page")` and expect one, and the licence-off container has none.
  - Existing: `WbPageTargetReader` (`~/features/target/WbPageTargetReader/index.js`; `read({ model, targetRevisionId }): Promise<{ model, page } | null>`, returns `null` for another namespace or a missing revision, throws on unexpected failures), `WbPageAccess` (`~/features/target/WbPageAccess/index.js`; `canRead(target): Promise<boolean>`), `WB_PAGE_NAMESPACE` (`~/constants.js`), `UpdatePageUseCase` (`@webiny/api-website-builder/features/pages/UpdatePage/index.js`; `execute(id, { properties?, ... }): Promise<Result<WbPage, PageNotAuthorizedError | PageValidationError | PageNotFoundError | PagePersistenceError>>`; checks `WbPermissions.canEdit("page")`, and the repository writes `values: data`, so the CMS update replaces `properties` as a whole), `WbPage` (`@webiny/api-website-builder/domain/page/abstractions.js`), `WorkflowBypassService` (`@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js`; `run<T>(callback)`, `isActive()`), `Logger` (`@webiny/api-core/features/logger/index.js`), `Result` (`@webiny/feature/api`), `ReviewTargetLockedError` (`@webiny/api-workflows/domain/review/errors.js`).
  - Test helpers: `createUserContext` (`~tests/__helpers/userContext.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `scriptTargetReads`, `throwingTargetRevisions`, `nullTargetRevisions`, `mismatchedTargetRevisions`, `targetReads` (`~tests/__helpers/ScriptedWbPageTargetReads.js`), `throwingAccessChecks`, `throwOnAccessChecks` (`~tests/__helpers/ThrowingWbPageAccess.js`), `createPage`, `expectOk` (`~tests/__helpers/pages.js`), `storeWbWorkflow`, `requestPageReview`, `readPage` (`~tests/__helpers/engine.js`), `NOBODY`, `READER`, `WB_READER`, `WB_WRITER` (`~tests/__helpers/identities.js`).
- Produces (matches the contract):
  - `WbPageReviewTargetEditor` (`~/features/target/WbPageReviewTargetEditor.js`): `ReviewTargetEditor` implementation, `canEdit(model)`, `read(params)`, `update(params)`, bounded and atomic as above. Consumed by Task 19 (indirectly, through the tools).
  - `toWbPageEditorFields(page: WbPageEditorSource): ReviewTargetEditorField[]`, `WB_PAGE_TITLE_FIELD`, `WB_PAGE_SEO_FIELDS`, `WbPageEditorSource`, `WbPageWritableField`, `WbElementsSummary` (`~/features/target/toWbPageEditorFields.js`), pure.
  - `isWbPageEditorValue(path: string, value: unknown): boolean` and `describeWbPageEditorValue(path: string): string` (`~/features/target/isWbPageEditorValue.js`), pure.
  - `toWbPageProperties(current: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown>` (`~/features/target/toWbPageProperties.js`), pure.
  - Test fixtures: `createRichPage(context, overrides?)`, `RICH_PROPERTIES` (`~tests/__helpers/richPages.js`), `updatePageFaults`, `failUpdatePage` (`~tests/__helpers/FailingUpdatePage.js`), `malformedWbPageTargetReader` (`~tests/__helpers/MalformedWbPageTargetReader.js`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-website-builder-workflows/__tests__/__helpers/richPages.ts`:

```ts
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";
import { expectOk } from "./pages.js";

/**
 * The `properties` of the page `createRichPage` creates: every key the editor must keep when it
 * writes `title` and the SEO scalars (`path` and `language` stay, `social`, `image`, `tags`,
 * `snippet` and `seo.metaTags` are read-only). `path` is made unique per page.
 */
export const RICH_PROPERTIES = {
    title: "Home",
    language: "en",
    snippet: "Welcome to Acme.",
    tags: ["news", "launch"],
    image: { id: "img-1", name: "hero.png", src: "https://files.example.com/hero.png" },
    seo: {
        title: "Home | Acme",
        description: "The home page.",
        metaTags: [{ name: "robots", content: "all" }],
        canonicalUrl: "/home",
        noIndex: false,
        noFollow: false,
        structuredSchema: "{}"
    },
    social: {
        title: "Acme on social",
        description: "Share me.",
        metaTags: [{ property: "og:type", content: "website" }]
    }
};

let pathCounter = 0;

/** Creates a draft page with a full `properties` blob, three elements and bindings, as the context's identity. */
export const createRichPage = async (
    context: CmsContext,
    overrides: Record<string, unknown> = {}
): Promise<WbPage> => {
    pathCounter++;
    return expectOk(
        await context.container.resolve(CreatePageUseCase).execute({
            properties: {
                ...RICH_PROPERTIES,
                path: `/rich-page-${pathCounter}`,
                ...overrides
            },
            metadata: { notes: "Draft." },
            bindings: { text1: { inputs: { text: { static: "Hello" } } } },
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Box" } },
                text1: {
                    type: "Webiny/Element",
                    id: "text1",
                    component: { name: "Webiny/Text" },
                    parent: { id: "root", slot: "children" }
                },
                text2: {
                    type: "Webiny/Element",
                    id: "text2",
                    component: { name: "Webiny/Text" },
                    parent: { id: "root", slot: "children" }
                }
            },
            location: { folderId: "root" }
        })
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/FailingUpdatePage.ts`:

```ts
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { PageValidationError } from "@webiny/api-website-builder/domain/page/errors.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";

export interface UpdatePageFaults {
    /** Makes `UpdatePageUseCase` throw. */
    throwing: boolean;
    /** Makes `UpdatePageUseCase` fail with a `PageValidationError` carrying raw provider text. */
    validation: boolean;
}

/** Reset it in `beforeEach`. */
export const updatePageFaults: UpdatePageFaults = { throwing: false, validation: false };

class FailingUpdatePage implements UpdatePageUseCase.Interface {
    public constructor(private decoratee: UpdatePageUseCase.Interface) {}

    public async execute(id: string, data: UpdatePageUseCase.UpdateData): UpdatePageUseCase.Return {
        if (updatePageFaults.throwing) {
            throw new Error("Storage is down.");
        }
        if (updatePageFaults.validation) {
            return Result.fail(
                new PageValidationError("Validator failed: connect ECONNREFUSED 10.0.0.5:9200")
            );
        }
        return this.decoratee.execute(id, data);
    }
}

/** Makes `UpdatePageUseCase` throw or fail validation as `updatePageFaults` says (`legacyPlugins`). */
export const failUpdatePage = (container: Container) => {
    container.registerDecorator(
        UpdatePageUseCase.createDecorator({ decorator: FailingUpdatePage, dependencies: [] })
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/MalformedWbPageTargetReader.ts`:

```ts
import type { Container } from "@webiny/di";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";

class MalformedWbPageTargetReader implements WbPageTargetReader.Interface {
    public constructor(private decoratee: WbPageTargetReader.Interface) {}

    public async read(
        params: WbPageTargetReader.Params
    ): Promise<WbPageTargetReader.Target | null> {
        const target = await this.decoratee.read(params);
        if (!target) {
            return null;
        }
        // A page whose `properties` is gone: `toWbPageEditorFields` throws on it.
        return { ...target, page: { ...target.page, properties: undefined as never } };
    }
}

/** Makes every target read return a page with no `properties` (`legacyPlugins`). */
export const malformedWbPageTargetReader = (container: Container) => {
    container.registerDecorator(
        WbPageTargetReader.createDecorator({
            decorator: MalformedWbPageTargetReader,
            dependencies: []
        })
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/target/toWbPageEditorFields.test.ts` (pure, hand-built pages):

```ts
import { describe, expect, it } from "vitest";
import {
    toWbPageEditorFields,
    type WbPageEditorSource
} from "~/features/target/toWbPageEditorFields.js";

const createSource = (properties: Record<string, unknown>): WbPageEditorSource => {
    return {
        properties: properties as WbPageEditorSource["properties"],
        location: { folderId: "root" },
        status: "draft",
        metadata: { notes: "n" },
        bindings: { a: { inputs: {} } },
        elements: {},
        extensions: undefined
    };
};

describe("toWbPageEditorFields", () => {
    it("lists the title, the other properties, the SEO scalars, the SEO rest and the page parts, in that order", () => {
        const fields = toWbPageEditorFields(
            createSource({
                title: "Home",
                path: "/home",
                language: "en",
                seo: { title: "S", metaTags: [], noIndex: true },
                social: { title: "T" }
            })
        );

        expect(fields.map(item => [item.path, item.writable])).toEqual([
            ["properties.title", true],
            ["properties.path", false],
            ["properties.language", false],
            ["properties.social", false],
            ["properties.seo.title", true],
            ["properties.seo.description", true],
            ["properties.seo.canonicalUrl", true],
            ["properties.seo.noIndex", true],
            ["properties.seo.noFollow", true],
            ["properties.seo.metaTags", false],
            ["location", false],
            ["status", false],
            ["metadata", false],
            ["bindings", false],
            ["extensions", false],
            ["elements", false]
        ]);
    });

    it("gives labels, types and values of the writable rows, null for a missing one", () => {
        const fields = toWbPageEditorFields(
            createSource({ title: "Home", seo: { title: "S", noIndex: true } })
        );

        expect(fields.filter(item => item.writable)).toEqual([
            {
                path: "properties.title",
                label: "Page title",
                type: "text",
                value: "Home",
                writable: true
            },
            {
                path: "properties.seo.title",
                label: "SEO title",
                type: "text",
                value: "S",
                writable: true
            },
            {
                path: "properties.seo.description",
                label: "SEO description",
                type: "long-text",
                value: null,
                writable: true
            },
            {
                path: "properties.seo.canonicalUrl",
                label: "SEO canonical URL",
                type: "text",
                value: null,
                writable: true
            },
            {
                path: "properties.seo.noIndex",
                label: "SEO no index",
                type: "boolean",
                value: true,
                writable: true
            },
            {
                path: "properties.seo.noFollow",
                label: "SEO no follow",
                type: "boolean",
                value: null,
                writable: true
            }
        ]);
    });

    it("reads every other properties key as one read-only row with its whole value and type", () => {
        const fields = toWbPageEditorFields(
            createSource({
                title: "Home",
                path: "/home",
                count: 3,
                flag: true,
                tags: ["a"],
                social: { title: "T" },
                nothing: null
            })
        );
        const byPath = Object.fromEntries(fields.map(item => [item.path, item]));

        expect(byPath["properties.path"]).toMatchObject({ type: "text", value: "/home" });
        expect(byPath["properties.count"]).toMatchObject({ type: "number", value: 3 });
        expect(byPath["properties.flag"]).toMatchObject({ type: "boolean", value: true });
        expect(byPath["properties.tags"]).toMatchObject({ type: "list", value: ["a"] });
        expect(byPath["properties.social"]).toMatchObject({ type: "object", value: { title: "T" } });
        expect(byPath["properties.nothing"]).toMatchObject({ type: "null", value: null });
    });

    it("reads the rest of the SEO group as read-only rows and a non-object seo as missing", () => {
        const withRest = toWbPageEditorFields(
            createSource({ title: "Home", seo: { metaTags: [{ name: "a", content: "b" }], extra: 1 } })
        );
        const withString = toWbPageEditorFields(createSource({ title: "Home", seo: "broken" }));

        expect(withRest.filter(item => item.path.startsWith("properties.seo.") && !item.writable)).toEqual([
            {
                path: "properties.seo.metaTags",
                label: "properties.seo.metaTags",
                type: "list",
                value: [{ name: "a", content: "b" }],
                writable: false
            },
            {
                path: "properties.seo.extra",
                label: "properties.seo.extra",
                type: "number",
                value: 1,
                writable: false
            }
        ]);
        expect(withString.filter(item => item.writable).map(item => item.value)).toEqual([
            "Home",
            null,
            null,
            null,
            null,
            null
        ]);
    });

    it("skips a properties key that contains a dot, so it cannot shadow an allowlisted path", () => {
        const fields = toWbPageEditorFields(
            createSource({ title: "Home", "seo.title": "shadow", seo: { title: "Real" } })
        );

        expect(fields.filter(item => item.path === "properties.seo.title")).toEqual([
            expect.objectContaining({ value: "Real", writable: true })
        ]);
    });

    it("summarises the element tree instead of listing it", () => {
        const fields = toWbPageEditorFields({
            ...createSource({ title: "Home" }),
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Box" } },
                a: { type: "Webiny/Element", id: "a", component: { name: "Webiny/Text" } },
                b: { type: "Webiny/Element", id: "b", component: { name: "Webiny/Text" } },
                c: { type: "Webiny/Element", id: "c" }
            }
        });

        expect(fields.find(item => item.path === "elements")).toEqual({
            path: "elements",
            label: "elements",
            type: "object",
            value: { count: 4, components: { "Webiny/Box": 1, "Webiny/Text": 2, "(none)": 1 } },
            writable: false
        });
    });

    it("gives location, status, metadata and bindings whole and an absent extensions as null", () => {
        const fields = toWbPageEditorFields(createSource({ title: "Home" }));
        const byPath = Object.fromEntries(fields.map(item => [item.path, item]));

        expect(byPath.location.value).toEqual({ folderId: "root" });
        expect(byPath.status.value).toBe("draft");
        expect(byPath.metadata.value).toEqual({ notes: "n" });
        expect(byPath.bindings.value).toEqual({ a: { inputs: {} } });
        expect(byPath.extensions.value).toBeNull();
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/target/isWbPageEditorValue.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    describeWbPageEditorValue,
    isWbPageEditorValue
} from "~/features/target/isWbPageEditorValue.js";

describe("isWbPageEditorValue", () => {
    it.each([
        ["properties.title", "Home", true],
        ["properties.title", "", false],
        ["properties.title", "   ", false],
        ["properties.title", null, false],
        ["properties.title", 5, false],
        ["properties.seo.title", "S", true],
        ["properties.seo.title", "", true],
        ["properties.seo.title", null, true],
        ["properties.seo.title", 5, false],
        ["properties.seo.description", "D", true],
        ["properties.seo.description", ["D"], false],
        ["properties.seo.canonicalUrl", "/home", true],
        ["properties.seo.canonicalUrl", null, true],
        ["properties.seo.canonicalUrl", false, false],
        ["properties.seo.canonicalUrl", "/ok", true],
        ["properties.seo.canonicalUrl", "https://example.com/home", false],
        ["properties.seo.canonicalUrl", "javascript:alert(1)", false],
        ["properties.seo.canonicalUrl", "//evil.example.com", false],
        ["properties.seo.canonicalUrl", "home", false],
        ["properties.seo.canonicalUrl", "", false],
        ["properties.seo.noIndex", true, true],
        ["properties.seo.noIndex", false, true],
        ["properties.seo.noIndex", null, false],
        ["properties.seo.noIndex", "true", false],
        ["properties.seo.noFollow", true, true],
        ["properties.seo.noFollow", 1, false],
        ["properties.path", "/x", false],
        ["properties.language", "en", false],
        ["elements", {}, false]
    ])("%s accepts %j: %s", (path, value, expected) => {
        expect(isWbPageEditorValue(path, value)).toBe(expected);
    });

    it("rejects undefined everywhere", () => {
        expect(isWbPageEditorValue("properties.title", undefined)).toBe(false);
        expect(isWbPageEditorValue("properties.seo.title", undefined)).toBe(false);
    });

    it("describes what each writable path expects", () => {
        expect(describeWbPageEditorValue("properties.title")).toBe("a non-empty string");
        expect(describeWbPageEditorValue("properties.seo.title")).toBe("a string or null");
        expect(describeWbPageEditorValue("properties.seo.description")).toBe("a string or null");
        expect(describeWbPageEditorValue("properties.seo.canonicalUrl")).toBe(
            "a pathname such as /path, or null"
        );
        expect(describeWbPageEditorValue("properties.seo.noIndex")).toBe("true or false");
        expect(describeWbPageEditorValue("properties.seo.noFollow")).toBe("true or false");
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/target/toWbPageProperties.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toWbPageProperties } from "~/features/target/toWbPageProperties.js";

const current = () => ({
    title: "Home",
    path: "/home",
    language: "en",
    tags: ["a"],
    social: { title: "T" },
    seo: {
        title: "S",
        description: "D",
        metaTags: [{ name: "robots", content: "all" }],
        noIndex: false
    }
});

describe("toWbPageProperties", () => {
    it("sets the title and returns every other key unchanged (the FULL properties)", () => {
        expect(toWbPageProperties(current(), { "properties.title": "New" })).toEqual({
            ...current(),
            title: "New"
        });
    });

    it("sets SEO scalars and keeps the other SEO keys, path, language and social", () => {
        const merged = toWbPageProperties(current(), {
            "properties.seo.title": "New S",
            "properties.seo.noIndex": true,
            "properties.seo.canonicalUrl": "/new"
        });

        expect(merged).toEqual({
            ...current(),
            seo: {
                title: "New S",
                description: "D",
                metaTags: [{ name: "robots", content: "all" }],
                noIndex: true,
                canonicalUrl: "/new"
            }
        });
        expect(merged.path).toBe("/home");
        expect(merged.language).toBe("en");
    });

    it("writes the title and SEO keys together", () => {
        const merged = toWbPageProperties(current(), {
            "properties.title": "New",
            "properties.seo.description": "New D"
        });

        expect(merged).toMatchObject({ title: "New", seo: { title: "S", description: "New D" } });
    });

    it("removes an SEO key written as null and leaves the rest", () => {
        const merged = toWbPageProperties(current(), { "properties.seo.description": null });

        expect(merged.seo).toEqual({
            title: "S",
            metaTags: [{ name: "robots", content: "all" }],
            noIndex: false
        });
    });

    it("creates seo when it is missing or not an object", () => {
        expect(
            toWbPageProperties({ title: "Home", path: "/home" }, { "properties.seo.title": "S" })
        ).toEqual({ title: "Home", path: "/home", seo: { title: "S" } });
        expect(
            toWbPageProperties({ title: "Home", seo: "broken" }, { "properties.seo.noFollow": true })
        ).toEqual({ title: "Home", seo: { noFollow: true } });
    });

    it("does not add seo when no SEO key is written", () => {
        expect(toWbPageProperties({ title: "Home" }, { "properties.title": "New" })).toEqual({
            title: "New"
        });
    });

    it("never mutates the current properties and copies the seo object it changes", () => {
        const values = current();
        const snapshot = JSON.parse(JSON.stringify(values));

        const merged = toWbPageProperties(values, {
            "properties.title": "New",
            "properties.seo.title": "New S"
        });

        expect(values).toEqual(snapshot);
        expect((merged.seo as object) === values.seo).toBe(false);
        expect(merged === (values as object)).toBe(false);
    });

    it("does not touch the prototype", () => {
        const merged = toWbPageProperties({ title: "Home" }, { "properties.seo.title": "S" });

        expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts`:

```ts
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
    return context.container
        .resolveAll(ReviewTargetEditor)
        .find(item => item.canEdit("wb.page"))!;
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
        expect(
            content.fields.map(item => [item.path, item.writable]).sort()
        ).toEqual(
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

    it("reads as the request identity: a user who cannot read pages gets nothing (SEC-66)", async () => {
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
```

Create `packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorUpdate.test.ts`:

```ts
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
    return context.container
        .resolveAll(ReviewTargetEditor)
        .find(item => item.canEdit("wb.page"))!;
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
        const mismatched = await update(context, page, { "properties.title": "Changed" }, other.entryId);

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
            error: { code: "WebsiteBuilder/Page/ValidationError" }
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
            error: { code: "WebsiteBuilder/Page/NotAuthorized" }
        });
        expect((await readProperties(admin, page)).title).toBe("Home");
    });

    it("treats a page the user cannot read as not found, without a log (SEC-66)", async () => {
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
        const inside = await bypass.run(() => update(context, page, { "properties.title": "Inside" }));
        const after = await update(context, page, { "properties.title": "After" });

        expect(outside.isFail()).toBe(true);
        expect(outside.error.message).toBe("The target could not be updated.");
        expect(loggedErrors[0].fields).toMatchObject({
            error: {
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
        expect((await readPage(context, page.id)).system?.workflow?.reviewState).toBe(
            "inProgress"
        );
        expect(bypass.isActive()).toBe(false);
    });
});
```

Modify `packages/api-website-builder-workflows/__tests__/registration.test.ts`: import `ReviewTargetEditor` (`@webiny/api-workflows/features/review/ReviewTargetEditor/index.js`) after the `ReviewTargetFolderChain` import and, in the first test, after the `ReviewTargetFolderChain` per-namespace `expect(...).toHaveLength(1);` block (the one ending `.filter(... item.canHandle("wb.page"))).toHaveLength(1);`) add:

```ts
        // Only the WB editor is asserted here (R172); this sub-phase does not depend on 6.6.
        expect(
            container
                .resolveAll(ReviewTargetEditor)
                .filter((item: ReviewTargetEditor.Interface) => item.canEdit("wb.page"))
        ).toHaveLength(1);
```

and in the licence-off test add one line after `expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);`:

```ts
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/toWbPageEditorFields.test.ts packages/api-website-builder-workflows/__tests__/target/isWbPageEditorValue.test.ts packages/api-website-builder-workflows/__tests__/target/toWbPageProperties.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorUpdate.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The three helper modules do not exist (import errors); the read and update tests find no `wb.page` editor (`getEditor` returns `undefined`, and `resolveAll(ReviewTargetEditor)` has no `wb.page` entry); the registration test finds no `wb.page` `ReviewTargetEditor` where it expects one.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-website-builder-workflows/__tests__/target/toWbPageEditorFields.test.ts packages/api-website-builder-workflows/__tests__/target/isWbPageEditorValue.test.ts packages/api-website-builder-workflows/__tests__/target/toWbPageProperties.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorUpdate.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: Implement**

Create `packages/api-website-builder-workflows/src/features/target/toWbPageEditorFields.ts`:

```ts
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import type { ReviewTargetEditorField } from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";

/** The parts of a page the editor reads. */
export type WbPageEditorSource = Pick<
    WbPage,
    "properties" | "location" | "status" | "metadata" | "bindings" | "elements" | "extensions"
>;

/** A field the AI may write (R172). */
export interface WbPageWritableField {
    /** The key `update` takes. */
    path: string;
    /** The key inside `properties.seo`; empty for the page title. */
    key: string;
    label: string;
    type: string;
}

/** What the model reads for the element tree instead of the tree itself. */
export interface WbElementsSummary {
    count: number;
    /** Component name to the number of elements that use it. */
    components: Record<string, number>;
}

export const WB_PAGE_TITLE_FIELD: WbPageWritableField = {
    path: "properties.title",
    key: "",
    label: "Page title",
    type: "text"
};

/** The SEO scalars of the page editor's SEO group (R172). `metaTags` and the rest are read-only. */
export const WB_PAGE_SEO_FIELDS: WbPageWritableField[] = [
    { path: "properties.seo.title", key: "title", label: "SEO title", type: "text" },
    {
        path: "properties.seo.description",
        key: "description",
        label: "SEO description",
        type: "long-text"
    },
    {
        path: "properties.seo.canonicalUrl",
        key: "canonicalUrl",
        label: "SEO canonical URL",
        type: "text"
    },
    { path: "properties.seo.noIndex", key: "noIndex", label: "SEO no index", type: "boolean" },
    { path: "properties.seo.noFollow", key: "noFollow", label: "SEO no follow", type: "boolean" }
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const typeOfValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "list";
    }
    switch (typeof value) {
        case "string":
            return "text";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        default:
            return "object";
    }
};

const toWritableRow = (field: WbPageWritableField, value: unknown): ReviewTargetEditorField => {
    return {
        path: field.path,
        label: field.label,
        type: field.type,
        value: value === undefined ? null : value,
        writable: true
    };
};

const toReadOnlyRow = (path: string, value: unknown): ReviewTargetEditorField => {
    return {
        path,
        label: path,
        type: typeOfValue(value),
        value: value === undefined ? null : value,
        writable: false
    };
};

const summarizeElements = (elements: unknown): WbElementsSummary => {
    const components = new Map<string, number>();
    let count = 0;
    if (isRecord(elements)) {
        for (const element of Object.values(elements)) {
            count++;
            const component = isRecord(element) ? element.component : undefined;
            const name =
                isRecord(component) && typeof component.name === "string"
                    ? component.name
                    : "(none)";
            components.set(name, (components.get(name) ?? 0) + 1);
        }
    }
    return { count, components: Object.fromEntries(components) };
};

/**
 * The page as the target editor shows it (R172): the title, every other `properties` key as one
 * read-only row with its whole value, the five writable SEO scalars, the rest of the SEO group as
 * read-only rows, the read-only page parts (`location`, `status`, `metadata`, `bindings`,
 * `extensions`) and a read-only summary of the element tree. `properties.path` and
 * `properties.language` are never writable. A `properties` key that contains a dot is skipped: its
 * row path could shadow an allowlisted path. Throws when `properties` is missing (the editor turns
 * that into a failed Result). Pure.
 */
export const toWbPageEditorFields = (page: WbPageEditorSource): ReviewTargetEditorField[] => {
    const properties: Record<string, unknown> = page.properties;
    const seo = isRecord(properties.seo) ? properties.seo : {};
    const rows: ReviewTargetEditorField[] = [toWritableRow(WB_PAGE_TITLE_FIELD, properties.title)];

    for (const [key, value] of Object.entries(properties)) {
        if (key === "title" || key === "seo" || key.includes(".")) {
            continue;
        }
        rows.push(toReadOnlyRow(`properties.${key}`, value));
    }
    for (const field of WB_PAGE_SEO_FIELDS) {
        rows.push(toWritableRow(field, seo[field.key]));
    }
    for (const [key, value] of Object.entries(seo)) {
        if (key.includes(".") || WB_PAGE_SEO_FIELDS.some(field => field.key === key)) {
            continue;
        }
        rows.push(toReadOnlyRow(`properties.seo.${key}`, value));
    }

    rows.push(
        toReadOnlyRow("location", page.location),
        toReadOnlyRow("status", page.status),
        toReadOnlyRow("metadata", page.metadata),
        toReadOnlyRow("bindings", page.bindings),
        toReadOnlyRow("extensions", page.extensions),
        {
            path: "elements",
            label: "elements",
            type: "object",
            value: summarizeElements(page.elements),
            writable: false
        }
    );
    return rows;
};
```

Create `packages/api-website-builder-workflows/src/features/target/isWbPageEditorValue.ts`:

```ts
/**
 * The pathname rule of the admin SEO group (`PATHNAME_REGEX` in
 * `packages/app-website-builder/src/presentation/pages/PageEditor/PageSettings/groups/SeoSettingsGroup.ts`),
 * copied here, not imported (the API must not depend on admin code). An empty string passes the
 * admin form (it is optional) but is rejected here: the model must send `null` to clear the key.
 */
const PATHNAME_REGEX = new RegExp(
    `^\\/(?:[a-zA-Z0-9._~:@!$&'()*+,;=%/-])*(?:\\?[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?(?:#[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?$`
);

/**
 * The admin rule lets `//host` through (its path class includes `/`), and a protocol-relative URL
 * is an external URL, so it is rejected on top of the copied rule.
 */
const isPathname = (value: unknown): boolean => {
    return typeof value === "string" && !value.startsWith("//") && PATHNAME_REGEX.test(value);
};

/**
 * Whether `value` is acceptable for the writable page path (R172). The page model stores
 * `properties` as JSON and nothing type-checks it, so the editor does before writing. The title is
 * required and never cleared; the SEO text fields accept `null` (the key is removed); the canonical
 * URL must also be a pathname (`/path`, the admin rule); the SEO flags are booleans. Any other path is not writable. Pure.
 */
export const isWbPageEditorValue = (path: string, value: unknown): boolean => {
    switch (path) {
        case "properties.title":
            return typeof value === "string" && value.trim() !== "";
        case "properties.seo.title":
        case "properties.seo.description":
            return value === null || typeof value === "string";
        case "properties.seo.canonicalUrl":
            return value === null || isPathname(value);
        case "properties.seo.noIndex":
        case "properties.seo.noFollow":
            return typeof value === "boolean";
        default:
            return false;
    }
};

/** What the model should send for a writable page path, for the error text. Pure. */
export const describeWbPageEditorValue = (path: string): string => {
    switch (path) {
        case "properties.title":
            return "a non-empty string";
        case "properties.seo.canonicalUrl":
            return "a pathname such as /path, or null";
        case "properties.seo.noIndex":
        case "properties.seo.noFollow":
            return "true or false";
        default:
            return "a string or null";
    }
};
```

Create `packages/api-website-builder-workflows/src/features/target/toWbPageProperties.ts`:

```ts
import {
    WB_PAGE_SEO_FIELDS,
    WB_PAGE_TITLE_FIELD
} from "./toWbPageEditorFields.js";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * The FULL `properties` object for the page update. The update replaces `properties` as a whole
 * (the CMS update merges top-level keys only), so every key of the current blob is carried over
 * (`path`, `language`, `social`, `seo.metaTags` and the rest) and only the written allowlisted keys
 * change. `seo` is a copy when any SEO key is written, a missing or non-object `seo` is created,
 * and an SEO key written as `null` is removed. The paths are already checked against the allowlist
 * (`toWbPageEditorFields`, `isWbPageEditorValue`), so a path is the title or one of the SEO
 * fields. The current values are never mutated. Pure.
 */
export const toWbPageProperties = (
    current: Record<string, unknown>,
    updates: Record<string, unknown>
): Record<string, unknown> => {
    const merged: Record<string, unknown> = { ...current };
    let seo: Record<string, unknown> | null = null;
    for (const [path, value] of Object.entries(updates)) {
        if (path === WB_PAGE_TITLE_FIELD.path) {
            merged.title = value;
            continue;
        }
        const field = WB_PAGE_SEO_FIELDS.find(item => item.path === path);
        if (!field) {
            continue;
        }
        if (seo === null) {
            seo = isRecord(current.seo) ? { ...current.seo } : {};
        }
        if (value === null) {
            delete seo[field.key];
        } else {
            seo[field.key] = value;
        }
    }
    if (seo !== null) {
        merged.seo = seo;
    }
    return merged;
};
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetEditor.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorField,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { WbPageAccess } from "./WbPageAccess/index.js";
import { toWbPageEditorFields } from "./toWbPageEditorFields.js";
import { describeWbPageEditorValue, isWbPageEditorValue } from "./isWbPageEditorValue.js";
import { toWbPageProperties } from "./toWbPageProperties.js";

/**
 * The `wb.page` editor of the AI step's built-in tools (spec 9.3, R172). `read` returns the whole
 * page (the element tree as a summary); `update` writes `properties.title` and the SEO scalars
 * `properties.seo.{title,description,canonicalUrl,noIndex,noFollow}` only, atomically, as the full
 * merged `properties` through the page update (`properties` only, so the element tree, bindings,
 * metadata and location are never in the write). The page is read as the request identity and
 * `WbPageAccess.canRead` decides whether it is visible (SEC-66); the write goes through
 * `UpdatePageUseCase`, which checks the write permission itself. The save-block bypass is the
 * tool's business (R173): this class neither reads nor sets it. Throws and failed Results become
 * failed Results with a fixed text, the real error is logged (R87).
 */
class WbPageReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private updatePage: UpdatePageUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public canEdit(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>> {
        try {
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (
                !target ||
                target.page.entryId !== params.targetId ||
                !(await this.access.canRead(target))
            ) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }

            // Inside the try: a malformed page makes these throw, and that must be a failed
            // Result, never a rejection (R87).
            return Result.ok({
                title: target.page.properties.title,
                fields: toWbPageEditorFields(target.page)
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

        let properties: Record<string, unknown>;
        try {
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (
                !target ||
                target.page.entryId !== params.targetId ||
                !(await this.access.canRead(target))
            ) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }

            // A Map, so a key such as "__proto__" is just an unknown path.
            const fields = new Map<string, ReviewTargetEditorField>();
            for (const field of toWbPageEditorFields(target.page)) {
                fields.set(field.path, field);
            }
            const problems: string[] = [];
            for (const path of paths) {
                const field = fields.get(path);
                if (!field) {
                    problems.push(`Unknown field "${path}". Use the paths returned by readTarget.`);
                } else if (!field.writable) {
                    problems.push(`The field "${path}" is read-only.`);
                } else if (!isWbPageEditorValue(path, params.values[path])) {
                    problems.push(
                        `The field "${path}" expects ${describeWbPageEditorValue(path)}.`
                    );
                }
            }
            if (problems.length > 0) {
                return Result.fail(new ReviewTargetEditorError(problems.join(" ")));
            }

            properties = toWbPageProperties(target.page.properties, params.values);
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not read the target for the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be read."));
        }

        try {
            const result = await this.updatePage.execute(params.targetRevisionId, { properties });
            if (result.isFail()) {
                // The page use case wraps CMS messages, so its text is never shown to the model.
                this.logger.error(
                    { error: result.error, model: params.model, targetId: params.targetId },
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

export const WbPageReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: WbPageReviewTargetEditorImpl,
    dependencies: [WbPageTargetReader, WbPageAccess, UpdatePageUseCase, Logger]
});
```

Modify `packages/api-website-builder-workflows/src/features/target/feature.ts`: add the import `import { WbPageReviewTargetEditor } from "./WbPageReviewTargetEditor.js";` after the `WbPageReviewTargetFolderChain` import, and register it after the four engine ports:

```ts
        container.register(WbPageReviewTargetFolderChain);

        // The AI step's editor port for pages (R172).
        container.register(WbPageReviewTargetEditor);
```

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/toWbPageEditorFields.test.ts packages/api-website-builder-workflows/__tests__/target/isWbPageEditorValue.test.ts packages/api-website-builder-workflows/__tests__/target/toWbPageProperties.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorUpdate.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-website-builder-workflows/__tests__/target/toWbPageEditorFields.test.ts packages/api-website-builder-workflows/__tests__/target/isWbPageEditorValue.test.ts packages/api-website-builder-workflows/__tests__/target/toWbPageProperties.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorUpdate.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

If a stored page reorders `properties` keys, only the set-based read assertions are affected (the pure test pins the order). If `RICH_PROPERTIES` is rejected by the page create (a key the page model refuses), drop that key from the fixture and from the assertions that name it; `path` and `language` must stay.

- [ ] **Step 5: Run the existing tests covering the changed code**

`target/feature.ts` is the gate of every page adapter port:

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAccess.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageFolderPort.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50`
Expected: PASS.
Run the same with `yarn test:os` (one run at a time). Expected: PASS.

Run the type check of the tests: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40`. Expected: no errors. If `result.value` or `result.error` is not accessible without narrowing in a test, use the same access the CMS editor tests of Tasks 11 and 12 use (they compile against the same `Result` type).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`, restore `.gitleaks.toml`), then commit:

```
feat(api-website-builder-workflows): add the page review target editor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
