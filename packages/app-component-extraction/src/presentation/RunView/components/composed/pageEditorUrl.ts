/**
 * The Website Builder editor URL for a composed page.
 *
 * The path is written out rather than built from `Routes.Pages.Editor`, because this package does not
 * depend on `@webiny/app-website-builder` and should not start to for one link — extraction produces
 * Website Builder pages, it is not part of Website Builder. The cost is that this mirrors a route
 * defined elsewhere, so it is here on its own with the route named:
 *
 *   packages/app-website-builder/src/routes.ts → Routes.Pages.Editor
 *   path: "/website-builder/pages/editor/:id"
 *
 * `id` is a page's REVISION id, which is what `PageMapEntry.pageId` holds — the editor loads it with
 * `getPage({ id })`, the same value `CreatePageDialog` hands it after creating a page. `entryId` is
 * the stable id across revisions and is not what this route takes.
 */
export const pageEditorUrl = (pageId: string): string =>
    `/website-builder/pages/editor/${encodeURIComponent(pageId)}`;
