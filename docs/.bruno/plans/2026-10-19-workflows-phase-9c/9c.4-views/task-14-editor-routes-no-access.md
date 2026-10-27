### Task 14: Editor routes show no access

R331, R316; Q61; D162 (refined by D178); 9c Global Constraints "Editor gate amended" and "Base packages" (the CMS and WB workflows packages change only here); design README 4 (the editor's no-permission state); Review Focus 6. Without the workflows `editor` permission, a direct URL to a workflow editor route showed the not-found page because `WorkflowEditorRoute` returned `null`. The route is now always registered (inside the flag gate the app packages already apply), and without `editor` its `AdminLayout` (same title and breadcrumbs) renders the existing `EditorNoPermission` (`You don't have access to workflows` / `Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role.`) instead of `WorkflowEditorView`, which is not mounted, so no editor query runs. `WorkflowEditorMenu` is unchanged (hidden without `editor`).

- `WorkflowEditorRoute` picks the element's content from `useWorkflowsPermission().editor`: `WorkflowEditorView` with the per-app props, else `EditorNoPermission`.
- `WorkflowEditorRoute.test.tsx`: the case `registers no route without the editor permission` becomes `registers the route and shows You don't have access to workflows without the editor permission; the editor view is not mounted`; the editor case also asserts that no `EditorNoPermission` is in the element.
- `CmsWorkflowEditor.test.tsx` and `WebsiteBuilderWorkflowsMenu.test.tsx`: the case `registers neither the route nor the menu item without the editor permission` (lines 198-207) becomes `registers the route but not the menu item without the editor permission`: `routeNames` contains the route name, `menuNames` does not contain the menu name.
- The comments of `CmsWorkflowEditor.tsx:8-11` and `WebsiteBuilderWorkflowsMenu.tsx:8-11` say that without `editor` the menu item renders nothing and the route shows the no-access view.

**Files:**
- Modify: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`
- Modify: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx` (comment only)
- Modify: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx` (comment only)
- Modify: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`

**Interfaces:**
- Consumes (verified with codegraph and the sources): `EditorNoPermission` (`packages/app-workflows/src/editor/presentation/editor/components/EditorNoPermission.tsx`, no props, an `EmptyState` with the two texts above), `WorkflowEditorView`, `useWorkflowsPermission`, `findElements` (`~/editor/testing/findElements.js`), `renderWithAdminUi` (`~/review/testing/renderWithAdminUi.js`).
- Produces: R331 (Task 18 documents it in spec 13.1).

**Test runner note:** admin packages, `yarn test <path>` only; one file per command.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`. Replace

```tsx
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
```

with

```tsx
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { EditorNoPermission } from "~/editor/presentation/editor/components/EditorNoPermission.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
```

Replace

```tsx
    it("registers no route without the editor permission", async () => {
        permission.editor = false;

        const items = await mount();
        const names = items.map(item => item.name);

        expect(names).toContain("Test/Sentinel");
        expect(names).not.toContain("Test/Workflows");
    });
```

with

```tsx
    it("registers the route and shows You don't have access to workflows without the editor permission; the editor view is not mounted", async () => {
        permission.editor = false;

        const items = await mount();
        const element = getEditorElement(items);
        const views = findElements(element, WorkflowEditorView);
        const noAccess = findElements(element, EditorNoPermission);

        expect(views).toHaveLength(0);
        expect(noAccess).toHaveLength(1);

        renderWithAdminUi(noAccess[0]);

        expect(screen.getByText("You don't have access to workflows")).toBeTruthy();
        expect(
            screen.getByText(
                "Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role."
            )
        ).toBeTruthy();
    });

    it("keeps the title and the breadcrumbs without the editor permission", async () => {
        permission.editor = false;

        const items = await mount();
        const element = getEditorElement(items);
        const layouts = findElements(element, AdminLayout);
        const titles = findElements(element, "title");
        const breadcrumbs = findElements(element, AdminConfig.Breadcrumb);
        const breadcrumbTexts = breadcrumbs.map(breadcrumb => {
            return `${breadcrumb.props.name}:${breadcrumb.props.label}`;
        });

        expect(layouts).toHaveLength(1);
        expect(titles[0].props.children).toBe("Workflows");
        expect(breadcrumbTexts).toEqual(["cms:Headless CMS", "cms.workflows:Workflows"]);
    });
```

Replace

```tsx
        const views = findElements(element, WorkflowEditorView);

        expect(views).toHaveLength(1);
        expect(views[0].props.useCases).toBe(useCases);
```

with

```tsx
        const views = findElements(element, WorkflowEditorView);
        const noAccess = findElements(element, EditorNoPermission);

        expect(views).toHaveLength(1);
        expect(noAccess).toHaveLength(0);
        expect(views[0].props.useCases).toBe(useCases);
```

Modify `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`. Replace

```tsx
    it("registers neither the route nor the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).not.toContain("Cms/ContentModels/Workflows");
        expect(menuNames).not.toContain("headlessCMS.contentModels.workflows");
    });
```

with

```tsx
    it("registers the route but not the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).toContain("Cms/ContentModels/Workflows");
        expect(menuNames).not.toContain("headlessCMS.contentModels.workflows");
    });
```

Modify `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`. Replace

```tsx
    it("registers neither the route nor the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).not.toContain("WebsiteBuilder/PageWorkflow");
        expect(menuNames).not.toContain("websiteBuilder.pages.workflows");
    });
```

with

```tsx
    it("registers the route but not the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).toContain("WebsiteBuilder/PageWorkflow");
        expect(menuNames).not.toContain("websiteBuilder.pages.workflows");
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
```

Expected: the two new `WorkflowEditorRoute` cases without `editor` fail with `The editor route is not registered.`; the CMS and WB cases fail on `expect(routeNames).toContain(...)`. Every other case passes. Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`. Replace

```tsx
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
```

with

```tsx
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { EditorNoPermission } from "~/editor/presentation/editor/components/EditorNoPermission.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
```

Replace

```tsx
/*
 * One workflow editor route per app over the shared view (R202). Only a viewer with the workflows
 * `editor` permission gets the route (D162); the server keeps its own checks.
 */
export const WorkflowEditorRoute = (props: WorkflowEditorRouteProps) => {
    const permission = useWorkflowsPermission();

    if (!permission.editor) {
        return null;
    }

    return (
```

with

```tsx
/*
 * One workflow editor route per app over the shared view (R202). The route is always registered
 * (the app packages mount it only with the flag on); without the workflows `editor` permission it
 * shows the no-access view and the editor view is not mounted, so no editor query runs (R331,
 * D162). The server keeps its own checks.
 */
export const WorkflowEditorRoute = (props: WorkflowEditorRouteProps) => {
    const permission = useWorkflowsPermission();

    let content: React.ReactNode = <EditorNoPermission />;
    if (permission.editor) {
        content = (
            <WorkflowEditorView
                useCases={props.useCases}
                reviewUseCases={props.reviewUseCases}
                app={props.app}
            />
        );
    }

    return (
```

Replace

```tsx
                        <AdminConfig.Breadcrumb name={props.breadcrumbName} label="Workflows" />
                        <WorkflowEditorView
                            useCases={props.useCases}
                            reviewUseCases={props.reviewUseCases}
                            app={props.app}
                        />
                    </AdminLayout>
```

with

```tsx
                        <AdminConfig.Breadcrumb name={props.breadcrumbName} label="Workflows" />
                        {content}
                    </AdminLayout>
```

Modify `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx`. Replace

```tsx
/*
 * Mounts the shared workflow editor route and menu item with the CMS use cases and adapter. Both
 * render nothing without the workflows `editor` permission (D162).
 */
```

with

```tsx
/*
 * Mounts the shared workflow editor route and menu item with the CMS use cases and adapter. Without
 * the workflows `editor` permission the menu item renders nothing and the route shows the
 * no-access view (D162, R331).
 */
```

Modify `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx`. Replace

```tsx
/*
 * Mounts the shared workflow editor route and menu item with the Website Builder use cases and
 * adapter. Both render nothing without the workflows `editor` permission (D162).
 */
```

with

```tsx
/*
 * Mounts the shared workflow editor route and menu item with the Website Builder use cases and
 * adapter. Without the workflows `editor` permission the menu item renders nothing and the route
 * shows the no-access view (D162, R331).
 */
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorStates.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in the three packages (the CMS and WB builds compile their co-located tests, R243).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): show the no-access view on the workflow editor routes" -m "The per-app editor route is registered whenever the flag is on; without the editor permission it shows the editor's no-access view instead of the not-found page and does not mount the editor. The menu item stays hidden." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **WB comment lines:** the contract names `CmsWorkflowEditor.tsx:8-11` and "its WB twin"; the WB comment is also at `WebsiteBuilderWorkflowsMenu.tsx:8-11` (verified), replaced in full.
- **Extra test:** the second `WorkflowEditorRoute` case (title and breadcrumbs kept without `editor`) pins R331's "title and breadcrumbs as today"; the contract's single renamed case covers the view swap.
- **Rendering the no-access element:** the route element is not rendered by the router probe (no matching URL), so the test renders the `EditorNoPermission` element it finds in the element tree inside `AdminUiProvider` to read the text.
- Size: small (one component hunk, two comments, three test hunks).

## Review fixes (sub-phase review)

- None. Imports, hunks (against the current `app.tsx`, `app.test.tsx`, `WorkflowEditorRoute.tsx` and its test, the CMS and WB route files and tests), commands and trailers checked; no change needed.
