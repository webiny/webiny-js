### Task 19: Editor session and `EditorReviewBar`

R202, R211, R212, R213, R234, R-c, R-e, R-f, R-k, R-l; A76, A77; Review Focus 5, 17 (the shared editor session and bar). What both app editors mount. `EditorReviewSession` is the shared, **plain** class `{ presenter, useCases }` that holds one editor's `TargetReviewPresenter` together with that app's use cases; `EditorReviewBar` renders the shared bar and the details drawer for a session. Each app (Tasks 20 and 22) subclasses the session once in its own file and registers the subclass as a singleton under its own token; this task registers nothing, because the shared class carries no `createImplementation` call (controller rule: `createImplementation` stores the abstraction and dependencies on the class itself, so a shared class bound under two tokens would be mis-bound silently).

- **`EditorReviewSession`** (`implements IEditorReviewSession`): constructor `(presenter: TargetReviewPresenter.Interface, useCases: IReviewUseCases)`, public readonly fields. It is a singleton in the apps (one editor is open at a time, the presenter's `dispose()` resets it, R212); the editor glue calls `session.presenter.init(...)` on mount and `dispose()` on unmount.
- **App usage** (Tasks 20 and 22, for the record): `class CmsEntryReviewSessionImpl extends EditorReviewSession implements Abstraction.Interface {}` then, in `CmsEntryReviewImpl.ts` (Task 20, R212; the token is imported `as Abstraction`), `export const CmsEntryReview = Abstraction.createImplementation({ implementation: CmsEntryReviewSessionImpl, dependencies: [TargetReviewPresenter, CmsReviewUseCases] })`, registered `.inSingletonScope()`.
- **`EditorReviewBar`** props `{ session; reviewsRoute }` (R-f: the bar reads the target and the content title from the presenter's view model, so the glue passes nothing else). It builds `reviewsUrl = useRouter().getLink(reviewsRoute)` (A76, verified below), renders `ReviewBar` and, when the viewer opens it, `ReviewDetailsDrawer`; the component stores the **opened review id** (`useState<string | null>`, set from `vm.reviewId` when "Review details" is clicked, `null` closes), so the drawer keeps showing the review that was opened even if the bar's review changes underneath. An action taken in the drawer refreshes the bar (`onChanged` -> `session.presenter.refresh()`).
- **A76 verified:** `useRouter().getLink(route)` returns `RouteUrl.fromPattern(route.path, params)`, a plain path string (`packages/app/src/features/router/RouterRepository.ts`), pinned by a test on `RouteUrl`.

**Files:**
- Create: `packages/app-workflows/src/review/editor/abstractions.ts`
- Create: `packages/app-workflows/src/review/editor/EditorReviewSession.ts`
- Create: `packages/app-workflows/src/review/editor/components/EditorReviewBar.tsx`
- Create: `packages/app-workflows/src/review/editor/EditorReviewSession.test.ts`
- Create: `packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx`

**Interfaces:**
- Consumes: Task 13 (`TargetReviewPresenter` with `.Interface`, `TargetReviewPresenterFeature`), Task 14 (`ReviewBar`, `createFakePresenter`, `createViewModel`), Task 18 (`ReviewDetailsDrawer`, `ReviewDetailsPresenterFeature`), Task 15 (`ReviewActionDialogPresenterFeature`, `renderWithContainer`), Task 8 (`IReviewUseCases`, `createReview`/`createReviewWithFlags` from `~/review/testing/reviewFixtures.js`), Task 13's builders and `TARGET`. Existing (verified): `useRouter` and `Route` (`@webiny/app`; `Route` constructor `{ name, path }`), `RouteUrl.fromPattern` (`@webiny/app/features/router/RouteUrl.js`), `createAbstraction` (`@webiny/feature/admin`).
- Produces: `IEditorReviewSession { readonly presenter: TargetReviewPresenter.Interface; readonly useCases: IReviewUseCases }` (`editor/abstractions.ts`; it has no token of its own, each app declares one); class `EditorReviewSession` (plain, no `createImplementation`); `EditorReviewBar` props `{ session: IEditorReviewSession; reviewsRoute: Route<any> }`. Imported by deep path (`@webiny/app-workflows/review/editor/EditorReviewSession.js`, `.../components/EditorReviewBar.js`); consumed by Tasks 20 and 22.

**Test runner note:** admin package, `yarn test <path>` only.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/editor/EditorReviewSession.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";
import { TargetReviewPresenterFeature } from "~/review/presentation/targetReview/feature.js";
import { EditorReviewSession } from "./EditorReviewSession.js";
import type { IEditorReviewSession } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";

/**
 * Two apps, each with its own use cases token and session token, in one container (A83, A77):
 * each subclasses the shared session once, as the app packages do.
 */
const CmsUseCases = createAbstraction<IReviewUseCases>("Test/Cms/ReviewUseCases");
const WbUseCases = createAbstraction<IReviewUseCases>("Test/Wb/ReviewUseCases");
const CmsEntryReview = createAbstraction<IEditorReviewSession>("Test/Cms/EntryReview");
const WbPageReview = createAbstraction<IEditorReviewSession>("Test/Wb/PageReview");

class CmsEntryReviewSessionImpl extends EditorReviewSession implements IEditorReviewSession {}
class WbPageReviewSessionImpl extends EditorReviewSession implements IEditorReviewSession {}

const CmsEntryReviewSession = CmsEntryReview.createImplementation({
    implementation: CmsEntryReviewSessionImpl,
    dependencies: [TargetReviewPresenter, CmsUseCases]
});
const WbPageReviewSession = WbPageReview.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter, WbUseCases]
});

const createContainer = () => {
    const container = new Container();
    container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ teams: [] })
    } as unknown as IdentityContext.Interface);
    TargetReviewPresenterFeature.register(container);
    container.register(CmsEntryReviewSession).inSingletonScope();
    container.register(WbPageReviewSession).inSingletonScope();
    return container;
};

describe("EditorReviewSession", () => {
    it("holds the presenter and the use cases it was constructed with", () => {
        const useCases = createFakeUseCases();
        const presenter = { vm: {} } as never;

        const session = new EditorReviewSession(presenter, useCases);

        expect(session.presenter).toBe(presenter);
        expect(session.useCases).toBe(useCases);
    });

    it("is a plain class: it carries no DI metadata of its own", () => {
        const container = new Container();
        expect(() => container.resolve(EditorReviewSession as never)).toThrow();
    });

    it("gives two apps two sessions with two presenters and their own use cases (R202, Review Focus 1)", async () => {
        const container = createContainer();
        const cmsUseCases = createFakeUseCases();
        const wbUseCases = createFakeUseCases();
        wbUseCases.getBoundWorkflow.mockResolvedValue(null);
        container.registerInstance(CmsUseCases, cmsUseCases);
        container.registerInstance(WbUseCases, wbUseCases);

        const cms = container.resolve(CmsEntryReview);
        const wb = container.resolve(WbPageReview);

        expect(cms).not.toBe(wb);
        expect(cms.presenter).not.toBe(wb.presenter);
        expect(cms.useCases).toBe(cmsUseCases);
        expect(wb.useCases).toBe(wbUseCases);

        await cms.presenter.init({
            useCases: cms.useCases,
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
        await wb.presenter.init({
            useCases: wb.useCases,
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });

        expect(cms.presenter.vm.status).toBe("none");
        expect(wb.presenter.vm.status).toBe("noWorkflow");
        expect(cmsUseCases.getBoundWorkflow).toHaveBeenCalledWith("cms.article");
        expect(wbUseCases.getBoundWorkflow).toHaveBeenCalledWith("wb.page");
    });

    it("is a singleton per app: the same session on every resolve", () => {
        const container = createContainer();
        container.registerInstance(CmsUseCases, createFakeUseCases());
        container.registerInstance(WbUseCases, createFakeUseCases());

        expect(container.resolve(CmsEntryReview)).toBe(container.resolve(CmsEntryReview));
    });

    it("resets the presenter on dispose so the next editor does not inherit the last one", async () => {
        const container = createContainer();
        const useCases = createFakeUseCases();
        container.registerInstance(CmsUseCases, useCases);
        container.registerInstance(WbUseCases, createFakeUseCases());
        const session = container.resolve(CmsEntryReview);
        await session.presenter.init({
            useCases,
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });

        session.presenter.dispose();

        expect(session.presenter.vm.status).toBe("loading");
        expect(session.presenter.vm.reviewId).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { Route } from "@webiny/app";
import { RouteUrl } from "@webiny/app/features/router/RouteUrl.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { EditorReviewBar } from "./EditorReviewBar.js";
import { EditorReviewSession } from "../EditorReviewSession.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return {
        ...actual,
        useRouter: () => ({
            getLink: (route: { path: string }) => route.path
        })
    };
});

const REVIEWS_ROUTE = new Route({ name: "Cms/ContentEntries/WorkflowStateList", path: "/cms/content-reviews" });

const createContainer = (toasts: ReviewToasts.Interface) => {
    const container = new Container();
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
    container.registerInstance(ReviewToasts, toasts);
    ReviewDetailsPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createSession = (vmOverrides = {}) => {
    const useCases = createFakeUseCases();
    const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(
            createReview({
                title: "Spring campaign review",
                currentStepId: "step-1",
                steps: [
                    createStep({ title: "Legal sign-off", state: StepState.InReview, owner })
                ]
            }),
            createFlags({ canApprove: true })
        )
    );
    const presenter = createFakePresenter(createViewModel(vmOverrides));
    return { session: new EditorReviewSession(presenter, useCases), presenter, useCases };
};

const renderBar = (session: EditorReviewSession) => {
    const toasts = { show: vi.fn<ReviewToasts.Interface["show"]>() };
    renderWithContainer(
        <EditorReviewBar
            session={session}
            reviewsRoute={REVIEWS_ROUTE}
        />,
        createContainer(toasts)
    );
    return toasts;
};

describe("RouteUrl (A76)", () => {
    it("turns a route path without params into the plain path string getLink returns", () => {
        expect(RouteUrl.fromPattern(REVIEWS_ROUTE.path)).toBe("/cms/content-reviews");
    });
});

describe("EditorReviewBar", () => {
    it("renders the shared review card for the session", () => {
        const { session } = createSession();

        renderBar(session);

        expect(screen.getByText("Luka Perić is reviewing")).toBeTruthy();
        expect(screen.getByText("Review details")).toBeTruthy();
    });

    it("passes the reviews url from the route to the dialogs (A76)", async () => {
        const { session } = createSession({
            openAction: { kind: "approve", stepId: "step-1" },
            reviewId: "review-1"
        });
        const toasts = renderBar(session);
        await screen.findByText("Approve “Legal sign-off”");

        fireEvent.click(screen.getByText("Approve", { selector: "button *, button" }));

        await vi.waitFor(() =>
            expect(toasts.show).toHaveBeenCalledWith(
                expect.objectContaining({ kind: "approved", reviewsUrl: "/cms/content-reviews" })
            )
        );
    });

    it("opens the details drawer for the bar's review", async () => {
        const { session, useCases } = createSession();
        renderBar(session);

        fireEvent.click(screen.getByText("Review details"));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(useCases.getReview).toHaveBeenCalledWith("review-1");
    });

    it("renders nothing for content without a workflow", () => {
        const { session } = createSession({ status: "noWorkflow", message: "", progress: null });

        renderBar(session);

        expect(screen.queryByText("Review details")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -30
```

Expected: `Failed to resolve import "./EditorReviewSession.js"` and `"./EditorReviewBar.js"`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/editor/abstractions.ts`:

```ts
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/**
 * One open editor's review state: its presenter and its app's use cases. Each app declares its
 * own token for it (`CmsEntryReview`, `WbPageReview`) with `createAbstraction<IEditorReviewSession>`
 * and binds a subclass of `EditorReviewSession` to it.
 */
export interface IEditorReviewSession {
    readonly presenter: TargetReviewPresenter.Interface;
    readonly useCases: IReviewUseCases;
}
```

Create `packages/app-workflows/src/review/editor/EditorReviewSession.ts`:

```ts
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { IEditorReviewSession } from "./abstractions.js";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/**
 * The shared editor session, exported as a plain class: it is never passed to
 * `createImplementation` here. `createImplementation` writes the abstraction and the
 * dependencies onto the class itself, so each app subclasses this class once in its own file and
 * binds the subclass to its own token and use cases (Tasks 20 and 22).
 */
export class EditorReviewSession implements IEditorReviewSession {
    constructor(
        public readonly presenter: TargetReviewPresenter.Interface,
        public readonly useCases: IReviewUseCases
    ) {}
}
```

Create `packages/app-workflows/src/review/editor/components/EditorReviewBar.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useRouter } from "@webiny/app";
import type { Route } from "@webiny/app";
import { ReviewBar } from "~/review/presentation/targetReview/components/ReviewBar.js";
import { ReviewDetailsDrawer } from "~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js";
import type { IEditorReviewSession } from "../abstractions.js";

export interface EditorReviewBarProps {
    session: IEditorReviewSession;
    reviewsRoute: Route<any>;
}

/**
 * What both app editors mount: the review bar of the session's presenter and, on demand, the
 * Review details drawer. The Content Reviews link of the toasts comes from the app's route (A76).
 */
export const EditorReviewBar = createReactiveComponent(function EditorReviewBar(
    props: EditorReviewBarProps
) {
    const { session, reviewsRoute } = props;
    const { getLink } = useRouter();
    const [detailsReviewId, setDetailsReviewId] = useState<string | null>(null);
    const { vm } = session.presenter;
    const reviewsUrl = getLink(reviewsRoute);

    return (
        <>
            <ReviewBar
                presenter={session.presenter}
                useCases={session.useCases}
                reviewsUrl={reviewsUrl}
                onOpenDetails={() => setDetailsReviewId(vm.reviewId)}
            />
            {detailsReviewId !== null ? (
                <ReviewDetailsDrawer
                    useCases={session.useCases}
                    reviewId={detailsReviewId}
                    reviewsUrl={reviewsUrl}
                    onClose={() => setDetailsReviewId(null)}
                    onChanged={() => session.presenter.refresh()}
                />
            ) : null}
        </>
    );
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -40
```

Expected: PASS. The `getLink` of a real `useRouter` needs the router feature registered; the test replaces `useRouter` and pins the real behaviour through `RouteUrl.fromPattern`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: this task's test files pass, no TypeScript errors (R-e: `yarn build -p @webiny/app-workflows` is the type check). Sub-phase gate for 8a.5: confirm the package builds after the last commit (tests run by path, per task).

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
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the editor review session and the editor review bar" -m "EditorReviewSession is a plain shared class holding an editor's presenter and its app's use cases; each app subclasses it once and binds the subclass to its own token. EditorReviewBar renders the shared bar and the details drawer and builds the Content Reviews link from the app's route." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- The app subclass files are named by the contract (R212, R237): CMS `CmsEntryReviewSessionImpl` in `CmsEntryReviewImpl.ts`, WB `WbPageReviewSessionImpl` in `WbPageReviewSessionImpl.ts` (exported as `WbPageReview`); Tasks 20 and 22 write them.
- Size: small (three source files, two test files).
