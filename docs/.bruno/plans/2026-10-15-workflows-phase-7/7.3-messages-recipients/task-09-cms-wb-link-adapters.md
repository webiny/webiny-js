### Task 9: CMS and Website Builder `ReviewTargetLink` adapters

Spec 9.3, 12; D133 (the client opens the right app by namespace; the engine cannot know admin routes); R195, R200; A62; Review Focus 6 (the path is built from an encoded revision id only). Each app registers one `ReviewTargetLink` for its namespace, the same pattern as `CmsEntryReviewTargetEditor` and `WbPageReviewTargetEditor` (R172). The engine reaches them only through `ReviewTargetLinkService` (Task 8).

- CMS: `CmsEntryReviewTargetLink`. `canLink(model)` is `isCmsNamespace(model)` (`cms.<modelId>`, the same check `CmsEntryReviewTargetEditor.canEdit` uses). `getPath` is `/cms/content-entries/{modelId}?id={encodeURIComponent(targetRevisionId)}`, with the model id taken from the namespace (`getModelIdFromAppName`). The admin route is `Cms/ContentEntries/List` (`/cms/content-entries/:modelId`), and the open entry is the `id` query parameter.
- WB: `WbPageReviewTargetLink`. `canLink(model)` is `model === WB_PAGE_NAMESPACE` (`wb.page`). `getPath` is `/website-builder/pages/editor/{encodeURIComponent(targetRevisionId)}`. The admin route is `WebsiteBuilder/Pages/Editor` (`/website-builder/pages/editor/:id`).
- A revision id such as `article-1#0001` carries a `#`: `encodeURIComponent` turns it into `%23`, so the browser never treats it as a fragment. The paths are tenant-free (the service appends `tenantId`, Task 8) and never include a host.
- Each file carries a comment that points at the admin route definition it mirrors (`packages/app-headless-cms/src/routes.ts`, `packages/app-website-builder/src/routes.ts`), because the routes live in client packages the API cannot import (a route change there must be mirrored here).
- Registered in each package's target feature next to the editor, inside the existing `advancedPublishingWorkflow` gate (the target features are only registered by it, R199): no license, no adapter.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetLink.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetLink.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetLink.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/feature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetLink.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - Task 8: `ReviewTargetLink` (`@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js`; `canLink(model: string): boolean`, `getPath(params: ReviewTargetLink.Params): string` with `Params { model; targetId; targetRevisionId }`, `createImplementation`). The package `@webiny/api-workflows` must be built with it (Step 2 builds it); both packages already depend on `@webiny/api-workflows`.
  - Existing, CMS: `isCmsNamespace`, `getModelIdFromAppName` (`~/utils/appName.js`; `getModelIdFromAppName("cms.article")` is `"article"`, `null` for any other namespace), `CmsTargetFeature` (`~/features/target/feature.ts`).
  - Existing, WB: `WB_PAGE_NAMESPACE` (`~/constants.js`, `"wb.page"`), `WbTargetFeature` (`~/features/target/feature.ts`).
  - Test helpers, CMS: `createTestContext` (`~tests/__helpers/testContext.js`). WB: `createUserContext` (`~tests/__helpers/userContext.js`), `createContextHandler` (`~tests/__helpers/handler.js`, already imported by the registration test).
- Produces (matches the contract): the two registered adapters `CmsEntryReviewTargetLink` and `WbPageReviewTargetLink`; no export for later tasks (the notifier resolves them through `ReviewTargetLinkService`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetLink.test.ts`:

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { createTestContext } from "~tests/__helpers/testContext.js";

let links: ReviewTargetLink.Interface[] = [];

beforeAll(async () => {
    const context = await createTestContext({ withWorkflow: false });
    links = context.container.resolveAll(ReviewTargetLink);
});

const getLink = (model: string): ReviewTargetLink.Interface => {
    return links.find(item => item.canLink(model))!;
};

describe("CmsEntryReviewTargetLink (R195)", () => {
    it("claims cms namespaces only, with exactly one adapter per cms namespace", () => {
        expect(links.filter(item => item.canLink("cms.article"))).toHaveLength(1);
        expect(links.filter(item => item.canLink("cms.blogPost"))).toHaveLength(1);
        expect(links.some(item => item.canLink("wb.page"))).toBe(false);
        expect(links.some(item => item.canLink("cms"))).toBe(false);
        expect(links.some(item => item.canLink("cms."))).toBe(false);
        expect(links.some(item => item.canLink("cms.a.b"))).toBe(false);
        expect(links.some(item => item.canLink("article"))).toBe(false);
    });

    it("builds the content entries path with the model id of the namespace and the encoded revision id", () => {
        const path = getLink("cms.article").getPath({
            model: "cms.article",
            targetId: "article-1",
            targetRevisionId: "article-1#0001"
        });

        expect(path).toBe("/cms/content-entries/article?id=article-1%230001");
    });

    it("takes the model id from the namespace", () => {
        const path = getLink("cms.blogPost").getPath({
            model: "cms.blogPost",
            targetId: "post-1",
            targetRevisionId: "post-1#0002"
        });

        expect(path).toBe("/cms/content-entries/blogPost?id=post-1%230002");
    });

    it("encodes every reserved character of the revision id", () => {
        const path = getLink("cms.article").getPath({
            model: "cms.article",
            targetId: "a",
            targetRevisionId: "a b/c#1&x=2?"
        });

        expect(path).toBe("/cms/content-entries/article?id=a%20b%2Fc%231%26x%3D2%3F");
    });

    it("is tenant-free and has no host (the link service adds both)", () => {
        const path = getLink("cms.article").getPath({
            model: "cms.article",
            targetId: "article-1",
            targetRevisionId: "article-1#0001"
        });

        expect(path.startsWith("/")).toBe(true);
        expect(path).not.toContain("tenantId");
        expect(path).not.toContain("://");
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetLink.test.ts`:

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";

let links: ReviewTargetLink.Interface[] = [];

beforeAll(async () => {
    const context = await createUserContext();
    links = context.container.resolveAll(ReviewTargetLink);
});

describe("WbPageReviewTargetLink (R195)", () => {
    it("claims the wb.page namespace only, beside the CMS adapter", () => {
        expect(links.filter(item => item.canLink("wb.page"))).toHaveLength(1);
        expect(links.filter(item => item.canLink("cms.article"))).toHaveLength(1);
        expect(links.some(item => item.canLink("wb.pages"))).toBe(false);
        expect(links.some(item => item.canLink("wb"))).toBe(false);
        expect(links.some(item => item.canLink("page"))).toBe(false);
    });

    it("builds the page editor path with the encoded revision id", () => {
        const link = links.find(item => item.canLink("wb.page"))!;

        const path = link.getPath({
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002"
        });

        expect(path).toBe("/website-builder/pages/editor/page-1%230002");
    });

    it("encodes every reserved character of the revision id", () => {
        const link = links.find(item => item.canLink("wb.page"))!;

        const path = link.getPath({
            model: "wb.page",
            targetId: "p",
            targetRevisionId: "p q/r#1?x=2"
        });

        expect(path).toBe("/website-builder/pages/editor/p%20q%2Fr%231%3Fx%3D2");
    });

    it("is tenant-free and has no host (the link service adds both)", () => {
        const link = links.find(item => item.canLink("wb.page"))!;

        const path = link.getPath({
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002"
        });

        expect(path.startsWith("/")).toBe(true);
        expect(path).not.toContain("tenantId");
        expect(path).not.toContain("://");
    });
});
```

Modify `packages/api-headless-cms-workflows/__tests__/registration.test.ts`. Add the import after the `ReviewTargetEditor` import:

```ts
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
```

In `registers one cms adapter port of each kind and every wrapper once`, after `expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(1);` add:

```ts
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(1);
```

In `registers no wrapper and no guard without the advancedPublishingWorkflow license`, after `expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);` add:

```ts
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(0);
```

Modify `packages/api-website-builder-workflows/__tests__/registration.test.ts`. Add the import after the `ReviewTargetEditor` import:

```ts
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
```

In `registers one page adapter port of each kind beside the CMS ones, and every wrapper once`, after the `ReviewTargetEditor` assertion block (the `.filter((item: ReviewTargetEditor.Interface) => item.canEdit("wb.page"))` one) add:

```ts
        // One link adapter per namespace too: `cms.*` from the CMS package, `wb.page` from this one.
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(2);
        expect(
            container
                .resolveAll(ReviewTargetLink)
                .filter((item: ReviewTargetLink.Interface) => item.canLink("wb.page"))
        ).toHaveLength(1);
```

In `registers no wrapper, guard, page adapter or page handler without the advancedPublishingWorkflow license`, after `expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);` add:

```ts
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(0);
```

- [ ] **Step 2: Build `@webiny/api-workflows`**

The sibling packages resolve `@webiny/api-workflows` from its `dist`, so the new `ReviewTargetLink` port (Task 8) must be built before these tests can import it:

Run: `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`
Expected: the build succeeds.

- [ ] **Step 3: Run the tests to see them fail**

`yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetLink.test.ts 2>&1 | tail -50`
Expected: FAIL, `links.find(...)!` is `undefined` (no `ReviewTargetLink` is registered): `TypeError: Cannot read properties of undefined (reading 'getPath')`, and the `toHaveLength(1)` claim fails with `0`.

`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetLink.test.ts 2>&1 | tail -50`
Expected: FAIL, the same.

`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50` and `yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, `expected [] to have a length of 1` (CMS) and `expected [] to have a length of 2` (WB).

Run the same four with `yarn test:os` (one at a time).
Expected: the same failures.

- [ ] **Step 4: Implement**

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetLink.ts`:

```ts
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";

/**
 * The `cms.<modelId>` admin link of a review's content (R195, D133). It mirrors the admin route
 * `Cms/ContentEntries/List` in `packages/app-headless-cms/src/routes.ts`
 * (`/cms/content-entries/:modelId`); the open entry is its `id` query parameter. That file lives
 * in a client package the API cannot import, so a route change there must be mirrored here. The
 * revision id carries a `#`, which `encodeURIComponent` turns into `%23` so the browser does not
 * read it as a fragment. The path has no host and no tenant: `ReviewTargetLinkService` adds both.
 */
class CmsEntryReviewTargetLinkImpl implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return isCmsNamespace(model);
    }

    public getPath(params: ReviewTargetLink.Params): string {
        // `canLink` guarantees a `cms.<modelId>` namespace; the fallback only keeps this a string.
        const modelId = getModelIdFromAppName(params.model) ?? params.model;
        return `/cms/content-entries/${encodeURIComponent(modelId)}?id=${encodeURIComponent(params.targetRevisionId)}`;
    }
}

export const CmsEntryReviewTargetLink = ReviewTargetLink.createImplementation({
    implementation: CmsEntryReviewTargetLinkImpl,
    dependencies: []
});
```

Modify `packages/api-headless-cms-workflows/src/features/target/feature.ts`. Add the import after the `CmsEntryReviewTargetEditor` import:

```ts
import { CmsEntryReviewTargetLink } from "./CmsEntryReviewTargetLink.js";
```

and register it after the editor:

```ts
        // The AI step's editor port, one per namespace (R172).
        container.register(CmsEntryReviewTargetEditor);

        // Where the notification e-mail links to the content, one per namespace (R195).
        container.register(CmsEntryReviewTargetLink);
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetLink.ts`:

```ts
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * The `wb.page` admin link of a review's content (R195, D133). It mirrors the admin route
 * `WebsiteBuilder/Pages/Editor` in `packages/app-website-builder/src/routes.ts`
 * (`/website-builder/pages/editor/:id`), where `:id` is the page revision id. That file lives in a
 * client package the API cannot import, so a route change there must be mirrored here. The
 * revision id carries a `#`, which `encodeURIComponent` turns into `%23`. The path has no host
 * and no tenant: `ReviewTargetLinkService` adds both.
 */
class WbPageReviewTargetLinkImpl implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public getPath(params: ReviewTargetLink.Params): string {
        return `/website-builder/pages/editor/${encodeURIComponent(params.targetRevisionId)}`;
    }
}

export const WbPageReviewTargetLink = ReviewTargetLink.createImplementation({
    implementation: WbPageReviewTargetLinkImpl,
    dependencies: []
});
```

Modify `packages/api-website-builder-workflows/src/features/target/feature.ts`. Add the import after the `WbPageReviewTargetEditor` import:

```ts
import { WbPageReviewTargetLink } from "./WbPageReviewTargetLink.js";
```

and register it after the editor:

```ts
        // The AI step's editor port for pages (R172).
        container.register(WbPageReviewTargetEditor);

        // Where the notification e-mail links to the page (R195).
        container.register(WbPageReviewTargetLink);
```

- [ ] **Step 5: Run the tests to see them pass**

`yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetLink.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetLink.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same four with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 6: Run the existing tests covering the changed code**

The two target features changed, so run the files that exercise them besides registration:

`yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageReviewTargetEditorRead.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts 2>&1 | tail -50`
and the same four with `yarn test:os` (one at a time).
Expected: PASS.

Run: `yarn check:test:types -p api-headless-cms-workflows,api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 7: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows`) with `--no-cache`, and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-headless-cms-workflows,api-website-builder-workflows): add the review target link adapters" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
