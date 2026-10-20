### Task 11: Details drawer and action dialogs inject their use cases; the session and the row binding stop carrying use cases

R349, R352, R353, R355, R357, R363; Q69, Q70; Review Focus 3, 4, 8 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342; one class or component per file; one named import per line; no inline object types; no nested call arguments; presenters own render-ready state, R234; components stay `createReactiveComponent` observers; namespace types outside the declaring file; targeted tests by path, one command at a time; the pre-commit chain; one commit). Inherited: 8a R220 (classification and copy unchanged), R237 (still binding for `AppReviewRowProvider` and `EditorReviewSession`, R347).

The last runtime carriers of review use cases go: the details drawer, the action and reassign dialogs inject what they call and receive the review's `namespace` instead of a bundle; the Content Reviews row binding and the editor session lose `useCases`.

- **Presenters (R352).** `ReviewDetailsPresenter` deps `[GetReviewUseCase, GetStepRunUseCase, ReviewActivity, IdentityContext]`; `ReviewActionDialogPresenter` deps `[GetReviewUseCase, StartReviewStepUseCase, TakeOverReviewStepUseCase, ApproveReviewStepUseCase, RejectReviewStepUseCase, CancelReviewUseCase, RestartReviewStepUseCase, ReviewToasts]`; `ReassignDialogPresenter` deps `[GetReviewUseCase, ListReviewStepCandidatesUseCase, ReassignReviewStepUseCase, ReviewerPickerPresenter, ReviewToasts]`. Every call passes `namespace: params.namespace` beside its old fields. `ReviewDetailsPresenter` still subscribes to `ReviewActivity` with the loaded review's namespace after its first successful load (R357); the queued refetch, the conflict re-read and the step-run token stay.
- **Init params and props (R353).** `ReviewDetailsInitParams`, `ReviewActionDialogInitParams`, `ReassignDialogInitParams` replace `useCases` by `namespace: string`. `ReviewDetailsDrawer`, `ReviewActionDialogs`, `ReviewActionDialogHost`, `ReassignDialogHost` and `ReviewBar` replace their `useCases` prop by `namespace: string`; the drawer forwards its own `namespace` to its nested `ReviewActionDialogs` (R363). `EditorReviewBar` passes `session.presenter.vm.namespace` to `ReviewBar` and `ReviewDetailsDrawer` (R363), so WB `PageReviewBar` (which renders `EditorReviewBar`) needs no change here. `ReviewListDialogs` passes `dialog.namespace` and still shows a row's dialogs only when `rowProvider.getBinding(namespace)` is not null.
- **Row binding and session (R352, R353).** `IReviewRowBinding` keeps `getContentUrl` and `getContentTypeLabel` (G3). `AppReviewRowProvider` takes only the content adapter; `CmsReviewRowProvider` / `WbReviewRowProvider` deps `[XReviewContentAdapter]`. `IEditorReviewSession` keeps `presenter`; `EditorReviewSession` takes only the presenter; `CmsEntryReview` / `WbPageReview` deps `[TargetReviewPresenter]`. Both stay app subclasses (R237).
- **Tests (R355).** Two new vitest fakes in `[AWRT]`: `createReviewUseCaseFakes()` (one fresh `{ execute: vi.fn() }` per use case the drawer and the dialogs inject, with the old bundle fake's defaults) and `registerReviewUseCaseFakes(container, fakes)`. Presenter tests read the fakes by use-case name (`setup.approveReviewStep.execute`); component tests register them in their container and render with `namespace="cms.article"`; every call assertion on an injected use case adds the namespace. Every behaviour assertion stays (Review Focus 4: the drawer's subscription and queued-refetch cases change only their fakes).

**Files:**
- Create: `packages/app-workflows/src/review/testing/createReviewUseCaseFakes.ts`
- Create: `packages/app-workflows/src/review/testing/registerReviewUseCaseFakes.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/{abstractions.ts,ReviewDetailsPresenter.ts,components/ReviewDetailsDrawer.tsx}`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/{abstractions.ts,reassignAbstractions.ts,ReviewActionDialogPresenter.ts,ReassignDialogPresenter.ts}`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/components/{ReviewActionDialogs.tsx,ReviewActionDialogHost.tsx,ReassignDialogHost.tsx}`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Modify: `packages/app-workflows/src/review/editor/{abstractions.ts,EditorReviewSession.ts,components/EditorReviewBar.tsx}`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/{abstractions.ts,components/ReviewListDialogs.tsx}`
- Modify: `packages/app-workflows/src/review/mounting/AppReviewRowProvider.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewRowProvider/CmsReviewRowProvider.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewRowProvider/WbReviewRowProvider.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorReview/CmsEntryReview.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorReview/WbPageReview.ts`
- Modify: `packages/app-headless-cms-workflows/src/testing/createEntrySession.ts`, `packages/app-website-builder-workflows/src/testing/createFakeSession.ts`
- Modify (tests): `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`, `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts`, `packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts`, `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx`, `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx`, `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`, `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`, `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx`, `packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx`, `packages/app-workflows/src/review/editor/EditorReviewSession.test.ts`, `packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts`, `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`, `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx`, `packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts`, `packages/app-headless-cms-workflows/src/index.editor.test.tsx`, `packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx`, `packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts`

**Interfaces:**
- Consumes: Task 8 (`GetReviewUseCase`, `GetStepRunUseCase`, `ListReviewStepCandidatesUseCase`), Task 9 (`StartReviewStepUseCase`, `TakeOverReviewStepUseCase`, `ReassignReviewStepUseCase`, `ApproveReviewStepUseCase`, `RejectReviewStepUseCase`, `CancelReviewUseCase`, `RestartReviewStepUseCase`), Task 10 (`TargetReviewInitParams` without `useCases`; `ReviewBar` still takes `useCases` for the action dialogs; the editor sessions still carry `useCases`). Existing (verified): `ITargetReviewViewModel.namespace` (`targetReview/abstractions.ts`; `TargetReviewPresenter.ts:91` fills it from `params.target.namespace`), `createViewModel` (default `namespace: "cms.article"`, `[AWRT]/targetReviewFakes.ts`), `createReviewListItem` (default `namespace: "cms.article"`), `createReview`, `createReviewWithFlags`, `createFlags`, `createStep`, `createActor` (`[AWRT]`), `ReviewerPickerPresenter` (`reviewerPicker/abstractions.ts`).
- Produces (matches the contract): R352 rows for `ReviewDetailsPresenter`, `ReviewActionDialogPresenter`, `ReassignDialogPresenter`, `AppReviewRowProvider` (+ CMS, WB), `EditorReviewSession` (+ `CmsEntryReview`, `WbPageReview`); R353: `ReviewDetailsInitParams.namespace`, `ReviewActionDialogInitParams.namespace`, `ReassignDialogInitParams.namespace`; `namespace` props on `ReviewDetailsDrawer`, `ReviewActionDialogs`, `ReviewActionDialogHost`, `ReassignDialogHost`, `ReviewBar`; `IReviewRowBinding` and `IEditorReviewSession` without `useCases`; `createReviewUseCaseFakes`, `ReviewUseCaseFakes`, `UseCaseFake`, `registerReviewUseCaseFakes` (Tasks 12-14 may reuse them).

**Test runner note:** admin packages, `yarn test <path>` only, one command at a time; `.tsx` tests import `React`. Type check: `yarn build -p @webiny/<package> --no-cache`.

Old bundle method -> injected use case, used by every mapping below:

| Old (`useCases.X`) | Fake field (`fakes.Y.execute`) | Token |
|---|---|---|
| `getReview` | `getReview` | `GetReviewUseCase` |
| `getStepRun` | `getStepRun` | `GetStepRunUseCase` |
| `listReviewStepCandidates` | `listReviewStepCandidates` | `ListReviewStepCandidatesUseCase` |
| `startStep` | `startReviewStep` | `StartReviewStepUseCase` |
| `takeOverStep` | `takeOverReviewStep` | `TakeOverReviewStepUseCase` |
| `reassignStep` | `reassignReviewStep` | `ReassignReviewStepUseCase` |
| `approveStep` | `approveReviewStep` | `ApproveReviewStepUseCase` |
| `rejectStep` | `rejectReviewStep` | `RejectReviewStepUseCase` |
| `cancelReview` | `cancelReview` | `CancelReviewUseCase` |
| `restartStep` | `restartReviewStep` | `RestartReviewStepUseCase` |

- [ ] **Step 1: Write the failing tests**

**1a. The fakes.** Create `packages/app-workflows/src/review/testing/createReviewUseCaseFakes.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import type { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import type { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import type { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import type { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import type { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import type { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import type { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import type { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import type { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
import { createReview } from "./reviewFixtures.js";
import { createReviewWithFlags } from "./reviewFixtures.js";

// One use case's `execute` as a vitest mock (R355).
export interface UseCaseFake<TExecute extends (...args: any[]) => any> {
    execute: Mock<TExecute>;
}

// One fake per use case the details drawer and the action dialogs inject, by use-case name.
export interface ReviewUseCaseFakes {
    getReview: UseCaseFake<GetReviewUseCase.Interface["execute"]>;
    getStepRun: UseCaseFake<GetStepRunUseCase.Interface["execute"]>;
    listReviewStepCandidates: UseCaseFake<ListReviewStepCandidatesUseCase.Interface["execute"]>;
    startReviewStep: UseCaseFake<StartReviewStepUseCase.Interface["execute"]>;
    takeOverReviewStep: UseCaseFake<TakeOverReviewStepUseCase.Interface["execute"]>;
    reassignReviewStep: UseCaseFake<ReassignReviewStepUseCase.Interface["execute"]>;
    approveReviewStep: UseCaseFake<ApproveReviewStepUseCase.Interface["execute"]>;
    rejectReviewStep: UseCaseFake<RejectReviewStepUseCase.Interface["execute"]>;
    cancelReview: UseCaseFake<CancelReviewUseCase.Interface["execute"]>;
    restartReviewStep: UseCaseFake<RestartReviewStepUseCase.Interface["execute"]>;
}

/*
 * Fresh fakes with the defaults of the old bundle fake: the review loads with its flags, no task
 * is found, nobody can be picked, and every action resolves the default review. Tests override one
 * with `mockResolvedValue` or `mockRejectedValue`.
 */
export const createReviewUseCaseFakes = (): ReviewUseCaseFakes => {
    const review = createReview();
    const reviewWithFlags = createReviewWithFlags(review);
    return {
        getReview: {
            execute: vi.fn<GetReviewUseCase.Interface["execute"]>().mockResolvedValue(reviewWithFlags)
        },
        getStepRun: {
            execute: vi.fn<GetStepRunUseCase.Interface["execute"]>().mockResolvedValue(null)
        },
        listReviewStepCandidates: {
            execute: vi
                .fn<ListReviewStepCandidatesUseCase.Interface["execute"]>()
                .mockResolvedValue([])
        },
        startReviewStep: {
            execute: vi.fn<StartReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        takeOverReviewStep: {
            execute: vi.fn<TakeOverReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        reassignReviewStep: {
            execute: vi.fn<ReassignReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        approveReviewStep: {
            execute: vi.fn<ApproveReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        rejectReviewStep: {
            execute: vi.fn<RejectReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        cancelReview: {
            execute: vi.fn<CancelReviewUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        restartReviewStep: {
            execute: vi.fn<RestartReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        }
    };
};
```

Create `packages/app-workflows/src/review/testing/registerReviewUseCaseFakes.ts`:

```ts
import type { Container } from "@webiny/di";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
import type { ReviewUseCaseFakes } from "./createReviewUseCaseFakes.js";

// Registers each fake under its use-case token, in place of the review services feature (R355).
export const registerReviewUseCaseFakes = (container: Container, fakes: ReviewUseCaseFakes): void => {
    container.registerInstance(GetReviewUseCase, fakes.getReview);
    container.registerInstance(GetStepRunUseCase, fakes.getStepRun);
    container.registerInstance(ListReviewStepCandidatesUseCase, fakes.listReviewStepCandidates);
    container.registerInstance(StartReviewStepUseCase, fakes.startReviewStep);
    container.registerInstance(TakeOverReviewStepUseCase, fakes.takeOverReviewStep);
    container.registerInstance(ReassignReviewStepUseCase, fakes.reassignReviewStep);
    container.registerInstance(ApproveReviewStepUseCase, fakes.approveReviewStep);
    container.registerInstance(RejectReviewStepUseCase, fakes.rejectReviewStep);
    container.registerInstance(CancelReviewUseCase, fakes.cancelReview);
    container.registerInstance(RestartReviewStepUseCase, fakes.restartReviewStep);
};
```

**1b. Group A: presenter tests** (`ReviewDetailsPresenter.test.ts`, `ReviewActionDialogPresenter.test.ts`, `ReassignDialogPresenter.test.ts`). Pattern per file:

1. Imports: drop `createFakeUseCases` and `FakeReviewUseCases`; add `import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";`, `import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";` and `import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";`.
2. `interface Setup {` becomes `interface Setup extends ReviewUseCaseFakes {` and loses its `useCases: FakeReviewUseCases;` line.
3. `createSetup` creates the fakes and registers them before the presenter feature: `const fakes = createReviewUseCaseFakes(); registerReviewUseCaseFakes(container, fakes);`, overrides its defaults on `fakes.<name>.execute`, returns `...fakes` first, and `params` sends `namespace: "cms.article"` in place of `useCases`.
4. Mechanical renames:

```bash
for F in packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts; do
  sed -i '' -E \
    -e 's/\.useCases\.getReview/.getReview.execute/g' \
    -e 's/\.useCases\.getStepRun/.getStepRun.execute/g' \
    -e 's/\.useCases\.listReviewStepCandidates/.listReviewStepCandidates.execute/g' \
    -e 's/\.useCases\.startStep/.startReviewStep.execute/g' \
    -e 's/\.useCases\.takeOverStep/.takeOverReviewStep.execute/g' \
    -e 's/\.useCases\.reassignStep/.reassignReviewStep.execute/g' \
    -e 's/\.useCases\.approveStep/.approveReviewStep.execute/g' \
    -e 's/\.useCases\.rejectStep/.rejectReviewStep.execute/g' \
    -e 's/\.useCases\.cancelReview/.cancelReview.execute/g' \
    -e 's/\.useCases\.restartStep/.restartReviewStep.execute/g' \
    "$F"
done
```

5. Every call assertion on an injected use case names the namespace: `getReview.execute).toHaveBeenCalledWith("review-1")` becomes `getReview.execute).toHaveBeenCalledWith({ namespace: "cms.article", reviewId: "review-1" })`, and every object passed to `toHaveBeenCalledWith({` of another use case gets `namespace: "cms.article",` as its first field. The lines (HEAD numbering): `ReviewDetailsPresenter.test.ts` 97, 468; `ReviewActionDialogPresenter.test.ts` 129, 242, 255, 265, 275, 281, 293, 698; `ReassignDialogPresenter.test.ts` 90, 91, 145. Check: `grep -n "execute).toHaveBeenCalledWith" <file>` lists exactly these, each with the namespace.

Worked example, `ReviewActionDialogPresenter.test.ts`. Before:

```ts
interface Setup {
    presenter: ReturnType<typeof ReviewActionDialogPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: (request: ReviewActionRequest) => ReviewActionDialogInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    container.registerInstance(ReviewToasts, toasts);
    ReviewActionDialogPresenterFeature.register(container);
    const { presenter } = ReviewActionDialogPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    useCases.getReview.mockResolvedValue(createReviewWithFlags(inReviewReview(), createFlags()));
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        useCases,
        toasts,
        onDone,
        onClose,
        params: request => ({
            useCases,
            request,
```

After:

```ts
interface Setup extends ReviewUseCaseFakes {
    presenter: ReturnType<typeof ReviewActionDialogPresenterFeature.resolve>["presenter"];
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: (request: ReviewActionRequest) => ReviewActionDialogInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    const fakes = createReviewUseCaseFakes();
    const review = inReviewReview();
    const flags = createFlags();
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewToasts, toasts);
    ReviewActionDialogPresenterFeature.register(container);
    const { presenter } = ReviewActionDialogPresenterFeature.resolve(container);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        ...fakes,
        presenter,
        toasts,
        onDone,
        onClose,
        params: request => ({
            namespace: "cms.article",
            request,
```

and, for example, before:

```ts
        expect(setup.approveReviewStep.execute).toHaveBeenCalledWith({
            reviewId: "review-1",
```

After:

```ts
        expect(setup.approveReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
```

`ReviewDetailsPresenter.test.ts` `createSetup` after:

```ts
const createSetup = (permissions: IPermission[] = []): Setup => {
    const container = new Container();
    const activity = createFakeActivity();
    const identityContext = createWorkflowsIdentityContext({ permissions });
    const fakes = createReviewUseCaseFakes();
    const review = createReview();
    const flags = createFlags({ canStart: true });
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, identityContext);
    ReviewDetailsPresenterFeature.register(container);
    const { presenter } = ReviewDetailsPresenterFeature.resolve(container);
    const onClose = vi.fn();
    const onChanged = vi.fn();
    return {
        ...fakes,
        presenter,
        activity,
        onClose,
        onChanged,
        params: () => ({
            namespace: "cms.article",
            reviewId: "review-1",
            reviewsUrl: "/cms/content-reviews",
            onClose,
            onChanged
        })
    };
};
```

`ReassignDialogPresenter.test.ts` `createSetup` after:

```ts
const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    const fakes = createReviewUseCaseFakes();
    const step = createStep({
        id: "step-1",
        title: "Legal sign-off",
        state: StepState.InReview,
        owner: LUKA
    });
    const review = createReview({ currentStepId: "step-1", steps: [step] });
    const flags = createFlags({ canReassign: true });
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    fakes.listReviewStepCandidates.execute.mockResolvedValue(CANDIDATES);
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    const { presenter } = ReassignDialogPresenterFeature.resolve(container);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        ...fakes,
        presenter,
        toasts,
        onDone,
        onClose,
        params: () => ({
            namespace: "cms.article",
            request: { kind: "reassign", reviewId: "review-1", stepId: "step-1" },
            reviewsUrl: "/cms/content-reviews",
            onDone,
            onClose
        })
    };
};
```

Add one case to `ReviewDetailsPresenter.test.ts`, right after the existing "subscribes with the namespace of the loaded review, after the first load" (R357, Review Focus 4). The existing cases already pin "only after the first successful load" (that case and "does not subscribe after a failed first load and subscribes once a retry succeeds" keep their assertions); the new case pins that the subscription still takes the loaded review's namespace although the init params now carry one:

```ts
    it("subscribes with the loaded review's namespace, not the init namespace, after the first load (R357)", async () => {
        const setup = createSetup();
        const first = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.getReview.execute.mockReturnValue(first.promise);
        const params = { ...setup.params(), namespace: "cms.other" };

        const pending = setup.presenter.init(params);
        expect(setup.activity.subscribe).not.toHaveBeenCalled();
        const review = createReview();
        const flags = createFlags();
        const loaded = createReviewWithFlags(review, flags);
        first.resolve(loaded);
        await pending;

        expect(setup.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.other",
            reviewId: "review-1"
        });
        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.subscribe.mock.calls[0][0]).toEqual(["cms.article"]);
    });
```

The same file's "is transient" case builds its own container, which now needs the two injected use cases. Before:

```ts
    it("is transient", () => {
        const container = new Container();
        container.registerInstance(ReviewActivity, createFakeActivity());
```

After:

```ts
    it("is transient", () => {
        const container = new Container();
        const fakes = createReviewUseCaseFakes();
        registerReviewUseCaseFakes(container, fakes);
        container.registerInstance(ReviewActivity, createFakeActivity());
```

**1c. Group B: component tests** (`ReviewActionDialogs.test.tsx`, `ReassignDialog.test.tsx`, `ReviewDetailsDrawer.test.tsx`). Pattern per file:

1. Imports: drop `createFakeUseCases`; add `createReviewUseCaseFakes`, `type ReviewUseCaseFakes` and `registerReviewUseCaseFakes` as in 1b.
2. `createContainer` takes the fakes first and registers them: `const createContainer = (fakes: ReviewUseCaseFakes, ...existingParams) => { const container = new Container(); registerReviewUseCaseFakes(container, fakes); ...unchanged }`.
3. Each `createUseCases*` helper starts from `createReviewUseCaseFakes()` and sets its defaults on `fakes.<name>.execute` (the bodies otherwise unchanged); it returns the fakes.
4. Each render: the element's `useCases={EXPR}` becomes `namespace={"cms.article"}`, and `createContainer(ARGS)` becomes `createContainer(FAKES, ARGS)`, where `FAKES` is the local the test already holds; when `EXPR` was an inline call (`useCases={createUseCases()}`), first add `const fakes = createUseCases();` above the render and pass `fakes` (no nested call argument).
5. Mechanical renames of the accesses (the local `useCases` becomes `fakes`):

```bash
for F in packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx; do
  sed -i '' -E \
    -e 's/([^A-Za-z.])useCases\.getReview/\1useCases.getReview.execute/g' \
    -e 's/([^A-Za-z.])useCases\.getStepRun/\1useCases.getStepRun.execute/g' \
    -e 's/([^A-Za-z.])useCases\.listReviewStepCandidates/\1useCases.listReviewStepCandidates.execute/g' \
    -e 's/([^A-Za-z.])useCases\.startStep/\1useCases.startReviewStep.execute/g' \
    -e 's/([^A-Za-z.])useCases\.takeOverStep/\1useCases.takeOverReviewStep.execute/g' \
    -e 's/([^A-Za-z.])useCases\.reassignStep/\1useCases.reassignReviewStep.execute/g' \
    -e 's/([^A-Za-z.])useCases\.approveStep/\1useCases.approveReviewStep.execute/g' \
    -e 's/([^A-Za-z.])useCases\.rejectStep/\1useCases.rejectReviewStep.execute/g' \
    -e 's/([^A-Za-z.])useCases\.cancelReview/\1useCases.cancelReview.execute/g' \
    -e 's/([^A-Za-z.])useCases\.restartStep/\1useCases.restartReviewStep.execute/g' \
    -e 's/([^A-Za-z.])useCases([^A-Za-z=])/\1fakes\2/g' \
    -e 's/([^A-Za-z.])useCases([^A-Za-z=])/\1fakes\2/g' \
    "$F"
done
grep -n "useCases" packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx
```

(The last rule leaves JSX attributes alone (`useCases={useCases}` becomes `useCases={fakes}`, as the worked example shows), so step 4 replaces each attribute by hand. Run steps 2-4 by hand after the `sed`; the final `grep` then lists only `createUseCases`/`createFailedUseCases`/`createAiUseCases` helper names, which keep their names.)

6. Call assertions name the namespace as in 1b: `ReviewActionDialogs.test.tsx` 229 (`restartReviewStep`), `ReviewDetailsDrawer.test.tsx` 382, 409 (`getStepRun`); `ReviewDetailsDrawer.test.tsx` 115 reads `await fakes.getReview.execute({ namespace: "cms.article", reviewId: "review-1" })`.

Worked example, `ReviewActionDialogs.test.tsx`. Before (after the `sed`, which renamed the local `useCases` to `fakes`):

```tsx
const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewActionDialogPresenterFeature.register(container);
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = () => {
    const fakes = createFakeUseCases();
    const review = createReview({
```

After:

```tsx
const createContainer = (fakes: ReviewUseCaseFakes) => {
    const container = new Container();
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewActionDialogPresenterFeature.register(container);
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = (): ReviewUseCaseFakes => {
    const fakes = createReviewUseCaseFakes();
    const review = createReview({
```

with the helper's last lines, before (after the `sed`):

```tsx
    fakes.getReview.execute.mockResolvedValue(createReviewWithFlags(review, createFlags()));
    return fakes;
};
```

After:

```tsx
    const flags = createFlags();
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    return fakes;
};
```

(`createFailedUseCases` the same way.) A render, before:

```tsx
    it("renders nothing without a request", () => {
        renderWithContainer(
            <ReviewActionDialogs
                useCases={createUseCases()}
                request={null}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );
```

After:

```tsx
    it("renders nothing without a request", () => {
        const fakes = createUseCases();
        renderWithContainer(
            <ReviewActionDialogs
                namespace={"cms.article"}
                request={null}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer(fakes)
        );
```

Another, before (after the `sed`):

```tsx
        const fakes = createUseCases();
        renderWithContainer(
            <ReviewActionDialogs
                useCases={fakes}
                request={{ kind: "approve", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );
        await screen.findByText("Approve “Legal sign-off”");

        fireEvent.click(screen.getByText("Approve", { selector: "button *, button" }));

        await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
        expect(fakes.approveReviewStep.execute).toHaveBeenCalledTimes(1);
```

After:

```tsx
        const fakes = createUseCases();
        renderWithContainer(
            <ReviewActionDialogs
                namespace={"cms.article"}
                request={{ kind: "approve", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer(fakes)
        );
        await screen.findByText("Approve “Legal sign-off”");

        fireEvent.click(screen.getByText("Approve", { selector: "button *, button" }));

        await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
        expect(fakes.approveReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });
```

(The approve case gains the exact call with the namespace, Review Focus 3.) The bar case at the end, before:

```tsx
        renderWithContainer(
            <ReviewBar presenter={presenter} useCases={createUseCases()} reviewsUrl={null} />,
            createContainer()
        );
```

After:

```tsx
        const fakes = createUseCases();
        renderWithContainer(
            <ReviewBar presenter={presenter} namespace={"cms.article"} reviewsUrl={null} />,
            createContainer(fakes)
        );
```

In `ReviewDetailsDrawer.test.tsx`, `renderDrawer` after:

```tsx
const renderDrawer = (
    fakes = createUseCases(),
    onClose = vi.fn(),
    permissions: IPermission[] = []
) => {
    renderWithContainer(
        <ReviewDetailsDrawer
            namespace={"cms.article"}
            reviewId={"review-1"}
            reviewsUrl={null}
            onClose={onClose}
        />,
        createContainer(fakes, permissions)
    );
    return { fakes, onClose };
};
```

and add, after the first drawer case:

```tsx
    it("reads the review and runs the nested dialogs on the drawer's namespace (R363)", async () => {
        const fakes = createUseCases();
        renderWithContainer(
            <ReviewDetailsDrawer
                namespace={"wb.page"}
                reviewId={"review-1"}
                reviewsUrl={null}
                onClose={vi.fn()}
            />,
            createContainer(fakes)
        );
        await screen.findByText("Spring campaign review");

        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));
        await screen.findByText("Start “Legal sign-off”?");
        fireEvent.click(screen.getAllByText("Start", { selector: "button *, button" }).pop()!);

        await waitFor(() => expect(fakes.startReviewStep.execute).toHaveBeenCalledTimes(1));
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            reviewId: "review-1"
        });
        expect(fakes.startReviewStep.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            reviewId: "review-1",
            stepId: "s2"
        });
    });
```

(Verified at HEAD: `createUseCases`'s review has the current step `s2` "Legal sign-off" with `canStart`, its start dialog reads `Start “Legal sign-off”?`, and the existing conflict case confirms it with `getAllByText("Start", ...).pop()`.)

**1d. Bar and editor bar.** `ReviewBar.test.tsx`: `renderBar` renders `<ReviewBar presenter={presenter} namespace={"cms.article"} reviewsUrl={null} onOpenDetails={onOpenDetails} />` and drops `const useCases = createFakeUseCases();`; the conflict case (Task 10) drops `const useCases = createFakeUseCases();` and renders with `namespace={"cms.article"}`; drop the `createFakeUseCases` import. `RequestReviewDialog.test.tsx` (Task 10's last case): drop `const bundle = createFakeUseCases();`, render `<ReviewBar presenter={presenter} namespace={TARGET.namespace} reviewsUrl={null} />` and drop the `createFakeUseCases` import.

`EditorReviewBar.test.tsx`. Before:

```tsx
const createContainer = (toasts: ReviewToasts.Interface) => {
    const container = new Container();
    container.registerInstance(ReviewActivity, createFakeActivity());
```

After:

```tsx
const createContainer = (toasts: ReviewToasts.Interface, fakes: ReviewUseCaseFakes) => {
    const container = new Container();
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewActivity, createFakeActivity());
```

Before:

```tsx
const createSession = (vmOverrides = {}) => {
    const useCases = createFakeUseCases();
    const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(
            createReview({
                title: "Spring campaign review",
                currentStepId: "step-1",
                steps: [createStep({ title: "Legal sign-off", state: StepState.InReview, owner })]
            }),
            createFlags({ canApprove: true })
        )
    );
    const presenter = createFakePresenter(createViewModel(vmOverrides));
    return { session: new EditorReviewSession(presenter, useCases), presenter, useCases };
};
```

After:

```tsx
const createSession = (vmOverrides = {}) => {
    const fakes = createReviewUseCaseFakes();
    const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
    const step = createStep({ title: "Legal sign-off", state: StepState.InReview, owner });
    const review = createReview({
        title: "Spring campaign review",
        currentStepId: "step-1",
        steps: [step]
    });
    const flags = createFlags({ canApprove: true });
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    const vm = createViewModel(vmOverrides);
    const presenter = createFakePresenter(vm);
    return { session: new EditorReviewSession(presenter), presenter, fakes };
};
```

Imports, before:

```tsx
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
```

After:

```tsx
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
```

`renderBar`, before:

```tsx
const renderBar = (session: EditorReviewSession) => {
    const toasts = { show: vi.fn<ReviewToasts.Interface["show"]>() };
    renderWithContainer(
        <EditorReviewBar session={session} reviewsRoute={REVIEWS_ROUTE} />,
        createContainer(toasts)
    );
    return toasts;
};
```

After:

```tsx
const renderBar = (session: EditorReviewSession, fakes: ReviewUseCaseFakes) => {
    const toasts = { show: vi.fn<ReviewToasts.Interface["show"]>() };
    renderWithContainer(
        <EditorReviewBar session={session} reviewsRoute={REVIEWS_ROUTE} />,
        createContainer(toasts, fakes)
    );
    return toasts;
};
```

In the cases `const { session, useCases } = createSession();` becomes `const { session, fakes } = createSession();` (and the other destructurings likewise; a case that destructured only `{ session }` or `{ session, presenter }` adds `fakes`, because every render now passes it), every `renderBar(session)` becomes `renderBar(session, fakes)`, and the accesses map by the table (`useCases.getReview` -> `fakes.getReview.execute`, `useCases.approveStep` -> `fakes.approveReviewStep.execute`). The `"review-1"` assertions become:

```tsx
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1"
        });
```

and

```tsx
        expect(fakes.getReview.execute).not.toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-2"
        });
```

Add one case (R363, Review Focus 3):

```tsx
    it("runs the bar's dialogs and the drawer on the namespace of the bar's target (R363)", async () => {
        const { session, fakes } = createSession({ namespace: "wb.page" });
        renderBar(session, fakes);

        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            reviewId: "review-1"
        });
    });
```

**1e. Session, provider and binding tests.**

`packages/app-workflows/src/review/editor/EditorReviewSession.test.ts` (as Task 10 left it): delete the `IReviewUseCases` and `createFakeUseCases` imports and the `CmsUseCases` / `WbUseCases` tokens; the two session bindings depend on `[TargetReviewPresenter]` only. The cases, after:

```ts
describe("EditorReviewSession", () => {
    it("holds the presenter it was constructed with", () => {
        const presenter = { vm: {} } as never;

        const session = new EditorReviewSession(presenter);

        expect(session.presenter).toBe(presenter);
        expect(Object.keys(session)).toEqual(["presenter"]);
    });

    it("is a plain class: it carries no DI metadata of its own", () => {
        const container = new Container();
        expect(() => container.resolve(EditorReviewSession as never)).toThrow();
    });

    it("gives two apps two sessions with two presenters over the injected use cases (R347, Review Focus 1)", async () => {
        const { container, getBoundWorkflow } = createContainer();

        const cms = container.resolve(CmsEntryReview);
        const wb = container.resolve(WbPageReview);

        expect(cms).not.toBe(wb);
        expect(cms.presenter).not.toBe(wb.presenter);

        await cms.presenter.init({
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });
        await wb.presenter.init({
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });

        expect(cms.presenter.vm.status).toBe("none");
        expect(wb.presenter.vm.status).toBe("noWorkflow");
        expect(getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: "cms.article" });
        expect(getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: "wb.page" });
    });

    it("is a singleton per app: the same session on every resolve", () => {
        const { container } = createContainer();

        expect(container.resolve(CmsEntryReview)).toBe(container.resolve(CmsEntryReview));
    });

    it("resets the presenter on dispose so the next editor does not inherit the last one", async () => {
        const { container } = createContainer();
        const session = container.resolve(CmsEntryReview);
        await session.presenter.init({
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });

        session.presenter.dispose();

        expect(session.presenter.vm.status).toBe("loading");
        expect(session.presenter.vm.reviewId).toBeNull();
    });
});
```

with the bindings, before:

```ts
const CmsEntryReviewSession = CmsEntryReview.createImplementation({
    implementation: CmsEntryReviewSessionImpl,
    dependencies: [TargetReviewPresenter, CmsUseCases]
});
const WbPageReviewSession = WbPageReview.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter, WbUseCases]
});
```

After:

```ts
const CmsEntryReviewSession = CmsEntryReview.createImplementation({
    implementation: CmsEntryReviewSessionImpl,
    dependencies: [TargetReviewPresenter]
});
const WbPageReviewSession = WbPageReview.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter]
});
```

and the header comment reads `Two apps, each with its own session token, in one container (A83, A77): each subclasses the shared session once, as the app packages do.`

`packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts` (whole file after):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { AppReviewRowProvider } from "./AppReviewRowProvider.js";

const createAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: namespace => namespace.startsWith("cms."),
        getContentUrl: vi.fn(ref => `/url/${ref.targetRevisionId}`),
        getContentTypeLabel: vi.fn(contentTypeId => `Label ${contentTypeId}`)
    };
};

describe("AppReviewRowProvider", () => {
    it("binds only the namespaces the adapter handles (R206)", () => {
        const provider = new AppReviewRowProvider(createAdapter());

        expect(provider.getBinding("cms.article")).not.toBeNull();
        expect(provider.getBinding("wb.page")).toBeNull();
    });

    it("delegates links and labels to the adapter and carries no use cases (R353)", () => {
        const adapter = createAdapter();
        const provider = new AppReviewRowProvider(adapter);

        const binding = provider.getBinding("cms.article");

        expect(binding).not.toBeNull();
        expect(binding).not.toHaveProperty("useCases");
        const ref = {
            namespace: "cms.article",
            targetId: "e1",
            targetRevisionId: "e1#0001",
            contentTypeId: "article"
        };
        expect(binding?.getContentUrl(ref)).toBe("/url/e1#0001");
        expect(adapter.getContentUrl).toHaveBeenCalledWith(ref);
        expect(binding?.getContentTypeLabel("article")).toBe("Label article");
    });

    it("keeps two providers on two adapters independent (R202)", () => {
        const cms = new AppReviewRowProvider(createAdapter());
        const wb = new AppReviewRowProvider({
            canHandle: namespace => namespace === "wb.page",
            getContentUrl: () => "/wb",
            getContentTypeLabel: () => null
        });

        expect(cms.getBinding("wb.page")).toBeNull();
        expect(wb.getBinding("cms.article")).toBeNull();
        const binding = wb.getBinding("wb.page");
        expect(binding).not.toBeNull();
        expect(binding).not.toHaveProperty("useCases");
    });
});
```

Row bindings built in list and widget tests lose their `useCases` field (the interface no longer has it):

- `ReviewListPresenter.test.ts` line 52 `useCases: cmsUseCases,` -> delete, and delete `const cmsUseCases = ...` if it is now unused, and the `IReviewUseCases` import.
- `reviewListPure.test.ts` line 277 `useCases: {} as unknown as IReviewRowBinding["useCases"],` -> delete.
- `ReviewWidgetPresenter.test.ts` line 45 `useCases: {} as unknown as IReviewUseCases,` -> delete, and the `IReviewUseCases` import.
- `ReviewWidgets.test.tsx` line 33 `useCases: {} as unknown as IReviewUseCases,` -> delete, and the `IReviewUseCases` import.

`ReviewListView.test.tsx` (the dialogs run on the row's namespace, R353, Review Focus 3): the stub props become

```tsx
interface DialogStubProps {
    namespace: string;
    request: { kind: string; reviewId: string; stepId: string | null } | null;
    listRefreshed?: boolean;
    onConflict?: () => void;
    onDone(): void;
    onClose(): void;
}

interface DrawerStubProps {
    namespace: string;
    reviewId: string;
    onChanged?: () => void;
    onClose(): void;
}
```

the two stubs write `"data-namespace": props.namespace` in place of `"data-usecases": props.useCases.name`; the row provider's binding drops `useCases: cmsUseCases,` (and `const cmsUseCases = ...` with the `IReviewUseCases` import); the three assertions (HEAD lines 271, 364, 758) `expect(X.getAttribute("data-usecases")).toBe("cms")` become `expect(X.getAttribute("data-namespace")).toBe("cms.article")` (the rows of those cases use `createReviewListItem`'s default namespace `cms.article`; if a case overrides `namespace`, assert that value).

**1f. CMS and WB glue tests.**

`packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts` (whole `createContainer` and first case after):

```ts
function createContainer() {
    const container = new Container();
    const presenter = createFakePresenter();
    container.registerInstance(TargetReviewPresenter, presenter);
    CmsEntryReviewFeature.register(container);

    return { container, presenter };
}

describe("CmsEntryReviewFeature", () => {
    it("builds the session from the shared presenter alone (R352)", () => {
        const { container, presenter } = createContainer();

        const { session } = CmsEntryReviewFeature.resolve(container);

        expect(session.presenter).toBe(presenter);
        expect(session).not.toHaveProperty("useCases");
    });
```

(drop the `createFakeUseCases` and `CmsReviewUseCases` imports; the other cases destructure `{ container }` as before.)

`packages/app-headless-cms-workflows/src/index.editor.test.tsx`: delete `container.registerInstance(CmsReviewUseCases, createFakeUseCases());` and the two imports.

`packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx`, before:

```tsx
    it("flag on: the session is registered over the shared presenter and this app's use cases", () => {
        const { container, presenter } = mountRoot(true);

        const session = container.resolve(WbPageReview);
        expect(session.presenter).toBe(presenter);
        expect(session.useCases).toBe(container.resolve(WbReviewUseCases));
    });

    it("flag on: this app's session and the CMS editor session coexist in one container (R237)", () => {
        const { container } = mountRoot(true);
        CmsReviewFeature.register(container);
        CmsEntryReviewFeature.register(container);

        const wbSession = container.resolve(WbPageReview);
        const cmsSession = container.resolve(CmsEntryReview);

        expect(cmsSession).not.toBe(wbSession);
        expect(wbSession.useCases).toBe(container.resolve(WbReviewUseCases));
        expect(cmsSession.useCases).toBe(container.resolve(CmsReviewUseCases));
        expect(cmsSession.useCases).not.toBe(wbSession.useCases);
    });
```

After:

```tsx
    it("flag on: the session is registered over the shared presenter, without use cases (R352)", () => {
        const { container, presenter } = mountRoot(true);

        const session = container.resolve(WbPageReview);
        expect(session.presenter).toBe(presenter);
        expect(session).not.toHaveProperty("useCases");
    });

    it("flag on: this app's session and the CMS editor session coexist in one container (R237)", () => {
        const { container, presenter } = mountRoot(true);
        CmsReviewFeature.register(container);
        CmsEntryReviewFeature.register(container);

        const wbSession = container.resolve(WbPageReview);
        const cmsSession = container.resolve(CmsEntryReview);

        expect(cmsSession).not.toBe(wbSession);
        expect(wbSession.presenter).toBe(presenter);
        expect(cmsSession.presenter).toBe(presenter);
        expect(wbSession.constructor).not.toBe(cmsSession.constructor);
    });
```

and drop the `CmsReviewUseCases` and `WbReviewUseCases` imports.

`packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts`: delete `container.registerInstance(CmsReviewUseCases, createFakeUseCases());` (the CMS row provider takes only its adapter now) and the two imports.

The session kits drop `useCases`: `packages/app-headless-cms-workflows/src/testing/createEntrySession.ts` (whole file after):

```ts
import { action } from "mobx";
import { observable } from "mobx";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createViewModel } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";

export interface EntrySession {
    session: IEditorReviewSession;
    presenter: FakeTargetReviewPresenter;
    setVm(overrides: Partial<TargetReviewPresenter.ViewModel>): void;
}

// A session over a fake presenter whose view model a test sets (R355: no use cases travel in it).
export function createEntrySession(
    initial: Partial<TargetReviewPresenter.ViewModel> = {}
): EntrySession {
    const state = observable.box(createViewModel(initial), { deep: false });
    const base = createFakePresenter();
    const presenter: FakeTargetReviewPresenter = {
        ...base,
        get vm() {
            return state.get();
        }
    };
    const session: IEditorReviewSession = { presenter };
    const setVm = action((overrides: Partial<TargetReviewPresenter.ViewModel>) => {
        state.set(createViewModel(overrides));
    });

    return { session, presenter, setVm };
}
```

`packages/app-website-builder-workflows/src/testing/createFakeSession.ts` (whole file after):

```ts
import { action } from "mobx";
import { observable } from "mobx";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import type { WbPageReview } from "~/features/editorReview/abstractions.js";
import type { FakeReviewKind } from "./createFakeVm.js";
import { createFakeVm } from "./createFakeVm.js";

export interface FakeSessionHandle {
    session: WbPageReview.Interface;
    presenter: FakeTargetReviewPresenter;
    setKind(kind: FakeReviewKind): void;
}

// A session over a fake presenter whose view model follows the given kind (R355: no use cases travel in it).
export const createFakeSession = (
    initialKind: FakeReviewKind = "none",
    isUnpublished: boolean = false
): FakeSessionHandle => {
    const state = observable.box(createFakeVm(initialKind, isUnpublished), { deep: false });
    const base = createFakePresenter();
    const presenter: FakeTargetReviewPresenter = {
        ...base,
        get vm() {
            return state.get();
        }
    };
    const session: WbPageReview.Interface = { presenter };

    const setKind = action((kind: FakeReviewKind): void => {
        state.set(createFakeVm(kind, isUnpublished));
    });

    return { session, presenter, setKind };
};
```

Check that no consumer reads the dropped field:

```bash
grep -rn "\.useCases\b\|useCases }" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src | grep -v "features/trash\|CmsContentReviews\|WbContentReviews\|features/gateway/feature"
```

Expected: no hit (the trash decorators and the Content Reviews mounts are Tasks 12 and 13).

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -30
```

Expected: the presenter, dialog, drawer and bar tests fail because the presenters still read `params.useCases` (`Cannot read properties of undefined (reading 'getReview')`) and never call the injected fakes; `EditorReviewSession.test.ts` fails to resolve the sessions (`No registration found for Test/...`, the session classes still declare the use-case dependency through the app bindings) or on `Object.keys(session)`; `AppReviewRowProvider.test.ts` fails (`binding` still has `useCases`, and the constructor reads the adapter from the second argument); `ReviewListView.test.tsx` fails on `data-namespace`; the glue tests fail on `toHaveProperty("useCases")`. Record the RED output.

- [ ] **Step 3: Implement**

**3a. Init params.** `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts`, before:

```ts
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
```

After:

```ts
import type { StepStateValue } from "~/review/domain/StepState.js";
```

Before:

```ts
export interface ReviewDetailsInitParams {
    useCases: IReviewUseCases;
    reviewId: string;
```

After:

```ts
export interface ReviewDetailsInitParams {
    // The review's namespace; the injected use cases route by it (R347, R353).
    namespace: string;
    reviewId: string;
```

`packages/app-workflows/src/review/presentation/actionDialog/abstractions.ts`, before:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReviewActionDialogInitParams {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
```

After:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReviewActionDialogInitParams {
    // The review's namespace; the injected use cases route by it (R347, R353).
    namespace: string;
    request: ReviewActionRequest;
```

`packages/app-workflows/src/review/presentation/actionDialog/reassignAbstractions.ts`, before:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReassignDialogInitParams {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
```

After:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReassignDialogInitParams {
    // The review's namespace; the injected use cases route by it (R347, R353).
    namespace: string;
    request: ReviewActionRequest;
```

**3b. `ReviewDetailsPresenter`.** Before:

```ts
import { ReviewActivity } from "~/review/activity/abstractions.js";
```

After:

```ts
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
```

Before:

```ts
    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewDetailsPresenterImpl,
            | "activity"
```

After:

```ts
    constructor(
        private getReviewUseCase: GetReviewUseCase.Interface,
        private getStepRunUseCase: GetStepRunUseCase.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewDetailsPresenterImpl,
            | "getReviewUseCase"
            | "getStepRunUseCase"
            | "activity"
```

Before:

```ts
        >(this, {
            activity: false,
            identityContext: false,
            token: false,
```

After:

```ts
        >(this, {
            getReviewUseCase: false,
            getStepRunUseCase: false,
            activity: false,
            identityContext: false,
            token: false,
```

Before:

```ts
            const loaded = await params.useCases.getReview(params.reviewId);
```

After:

```ts
            const loaded = await this.getReviewUseCase.execute({
                namespace: params.namespace,
                reviewId: params.reviewId
            });
```

Before:

```ts
            const info = await params.useCases.getStepRun({
                reviewId: params.reviewId,
```

After:

```ts
            const info = await this.getStepRunUseCase.execute({
                namespace: params.namespace,
                reviewId: params.reviewId,
```

Before:

```ts
    dependencies: [ReviewActivity, IdentityContext]
});
```

After:

```ts
    dependencies: [GetReviewUseCase, GetStepRunUseCase, ReviewActivity, IdentityContext]
});
```

**3c. `ReviewActionDialogPresenter`.** Before:

```ts
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import type { ReviewToastParams } from "~/review/toasts/abstractions.js";
```

After:

```ts
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import type { ReviewToastParams } from "~/review/toasts/abstractions.js";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
```

Before:

```ts
    constructor(private toasts: ReviewToasts.Interface) {
        makeAutoObservable<
            ReviewActionDialogPresenterImpl,
            "toasts" | "token" | "params" | "review"
        >(this, {
            toasts: false,
```

After:

```ts
    constructor(
        private getReviewUseCase: GetReviewUseCase.Interface,
        private startReviewStepUseCase: StartReviewStepUseCase.Interface,
        private takeOverReviewStepUseCase: TakeOverReviewStepUseCase.Interface,
        private approveReviewStepUseCase: ApproveReviewStepUseCase.Interface,
        private rejectReviewStepUseCase: RejectReviewStepUseCase.Interface,
        private cancelReviewUseCase: CancelReviewUseCase.Interface,
        private restartReviewStepUseCase: RestartReviewStepUseCase.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            ReviewActionDialogPresenterImpl,
            | "getReviewUseCase"
            | "startReviewStepUseCase"
            | "takeOverReviewStepUseCase"
            | "approveReviewStepUseCase"
            | "rejectReviewStepUseCase"
            | "cancelReviewUseCase"
            | "restartReviewStepUseCase"
            | "toasts"
            | "token"
            | "params"
            | "review"
        >(this, {
            getReviewUseCase: false,
            startReviewStepUseCase: false,
            takeOverReviewStepUseCase: false,
            approveReviewStepUseCase: false,
            rejectReviewStepUseCase: false,
            cancelReviewUseCase: false,
            restartReviewStepUseCase: false,
            toasts: false,
```

Before:

```ts
            const loaded = await params.useCases.getReview(params.request.reviewId);
```

After:

```ts
            const loaded = await this.getReviewUseCase.execute({
                namespace: params.namespace,
                reviewId: params.request.reviewId
            });
```

Before:

```ts
        const { useCases, request } = params;
        const stepId = request.stepId ?? "";
```

After:

```ts
        const { namespace, request } = params;
        const stepId = request.stepId ?? "";
```

Before:

```ts
            if (request.kind === "start") {
                await useCases.startStep({ reviewId: request.reviewId, stepId });
                toast = { kind: "started", stepTitle, personName: null, reviewsUrl };
            } else if (request.kind === "takeOver") {
                await useCases.takeOverStep({
                    reviewId: request.reviewId,
                    stepId,
                    notifyPreviousOwner: this.notify
                });
                toast = { kind: "tookOver", stepTitle, personName: notifyName, reviewsUrl };
            } else if (request.kind === "approve") {
                const approved = await useCases.approveStep({
                    reviewId: request.reviewId,
                    stepId,
                    comment: comment === "" ? null : comment
                });
```

After:

```ts
            if (request.kind === "start") {
                await this.startReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId
                });
                toast = { kind: "started", stepTitle, personName: null, reviewsUrl };
            } else if (request.kind === "takeOver") {
                await this.takeOverReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId,
                    notifyPreviousOwner: this.notify
                });
                toast = { kind: "tookOver", stepTitle, personName: notifyName, reviewsUrl };
            } else if (request.kind === "approve") {
                const approved = await this.approveReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId,
                    comment: comment === "" ? null : comment
                });
```

Before:

```ts
            } else if (request.kind === "reject") {
                await useCases.rejectStep({ reviewId: request.reviewId, stepId, comment });
                toast = { kind: "rejected", stepTitle, personName: null, reviewsUrl };
            } else if (request.kind === "cancel") {
                await useCases.cancelReview({ reviewId: request.reviewId });
            } else if (request.kind === "restart") {
                await useCases.restartStep({ reviewId: request.reviewId, stepId });
```

After:

```ts
            } else if (request.kind === "reject") {
                await this.rejectReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId,
                    comment
                });
                toast = { kind: "rejected", stepTitle, personName: null, reviewsUrl };
            } else if (request.kind === "cancel") {
                await this.cancelReviewUseCase.execute({ namespace, reviewId: request.reviewId });
            } else if (request.kind === "restart") {
                await this.restartReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId
                });
```

Before:

```ts
                    fresh = await useCases.getReview(request.reviewId);
```

After:

```ts
                    fresh = await this.getReviewUseCase.execute({
                        namespace,
                        reviewId: request.reviewId
                    });
```

Before:

```ts
    dependencies: [ReviewToasts]
});
```

After:

```ts
    dependencies: [
        GetReviewUseCase,
        StartReviewStepUseCase,
        TakeOverReviewStepUseCase,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        CancelReviewUseCase,
        RestartReviewStepUseCase,
        ReviewToasts
    ]
});
```

**3d. `ReassignDialogPresenter`.** Before:

```ts
import { ReviewToasts } from "~/review/toasts/abstractions.js";
```

After:

```ts
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
```

Before:

```ts
    constructor(
        private picker: ReviewerPickerPresenter.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            ReassignDialogPresenterImpl,
            "picker" | "toasts" | "token" | "params" | "review" | "candidates"
        >(this, {
            picker: false,
```

After:

```ts
    constructor(
        private getReviewUseCase: GetReviewUseCase.Interface,
        private listReviewStepCandidatesUseCase: ListReviewStepCandidatesUseCase.Interface,
        private reassignReviewStepUseCase: ReassignReviewStepUseCase.Interface,
        private picker: ReviewerPickerPresenter.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            ReassignDialogPresenterImpl,
            | "getReviewUseCase"
            | "listReviewStepCandidatesUseCase"
            | "reassignReviewStepUseCase"
            | "picker"
            | "toasts"
            | "token"
            | "params"
            | "review"
            | "candidates"
        >(this, {
            getReviewUseCase: false,
            listReviewStepCandidatesUseCase: false,
            reassignReviewStepUseCase: false,
            picker: false,
```

`init`, before:

```ts
        const { useCases, request } = params;
        const stepId = request.stepId ?? "";

        try {
            const loaded = await useCases.getReview(request.reviewId);
```

After:

```ts
        const { namespace, request } = params;
        const stepId = request.stepId ?? "";

        try {
            const loaded = await this.getReviewUseCase.execute({
                namespace,
                reviewId: request.reviewId
            });
```

Before:

```ts
                    const candidates = await useCases.listReviewStepCandidates({
                        reviewId: request.reviewId,
```

After:

```ts
                    const candidates = await this.listReviewStepCandidatesUseCase.execute({
                        namespace,
                        reviewId: request.reviewId,
```

`submit`, before:

```ts
        const { useCases, request } = params;
        const step = loaded.review.steps.find(item => item.id === request.stepId);
```

After:

```ts
        const { namespace, request } = params;
        const step = loaded.review.steps.find(item => item.id === request.stepId);
```

Before:

```ts
            await useCases.reassignStep({
                reviewId: request.reviewId,
```

After:

```ts
            await this.reassignReviewStepUseCase.execute({
                namespace,
                reviewId: request.reviewId,
```

Before:

```ts
                    fresh = await useCases.getReview(request.reviewId);
```

After:

```ts
                    fresh = await this.getReviewUseCase.execute({
                        namespace,
                        reviewId: request.reviewId
                    });
```

Before:

```ts
    dependencies: [ReviewerPickerPresenter, ReviewToasts]
});
```

After:

```ts
    dependencies: [
        GetReviewUseCase,
        ListReviewStepCandidatesUseCase,
        ReassignReviewStepUseCase,
        ReviewerPickerPresenter,
        ReviewToasts
    ]
});
```

**3e. Components.** `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.tsx`, before:

```tsx
import React from "react";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReassignDialogHost } from "./ReassignDialogHost.js";
import { ReviewActionDialogHost } from "./ReviewActionDialogHost.js";

export interface ReviewActionDialogsProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest | null;
```

After:

```tsx
import React from "react";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReassignDialogHost } from "./ReassignDialogHost.js";
import { ReviewActionDialogHost } from "./ReviewActionDialogHost.js";

export interface ReviewActionDialogsProps {
    // The review's namespace (R353).
    namespace: string;
    request: ReviewActionRequest | null;
```

`ReviewActionDialogHost.tsx`, before:

```tsx
import { useFeature } from "@webiny/app";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { ReviewActionDialogPresenterFeature } from "../feature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialog } from "./ReviewActionDialog.js";

export interface ReviewActionDialogHostProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
```

After:

```tsx
import { useFeature } from "@webiny/app";
import { ReviewActionDialogPresenterFeature } from "../feature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialog } from "./ReviewActionDialog.js";

export interface ReviewActionDialogHostProps {
    namespace: string;
    request: ReviewActionRequest;
```

Before:

```tsx
    const { useCases, request, reviewsUrl, listRefreshed, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(ReviewActionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({
            useCases,
            request,
```

After:

```tsx
    const { namespace, request, reviewsUrl, listRefreshed, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(ReviewActionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({
            namespace,
            request,
```

`ReassignDialogHost.tsx`: the same three hunks with `ReassignDialogPresenterFeature` / `ReassignDialog` (the import line `import type { IReviewUseCases } ...` is deleted, `useCases: IReviewUseCases;` becomes `namespace: string;`, the destructuring and the `init` field become `namespace`).

`packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx`, before:

```tsx
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
```

After: the line is deleted. Before:

```tsx
export interface ReviewDetailsDrawerProps {
    useCases: IReviewUseCases;
    reviewId: string;
```

After:

```tsx
export interface ReviewDetailsDrawerProps {
    // The review's namespace; the drawer and its nested dialogs run on it (R353, R363).
    namespace: string;
    reviewId: string;
```

Before:

```tsx
interface ReviewDetailsDrawerViewProps {
    presenter: ReviewDetailsPresenter.Interface;
    useCases: IReviewUseCases;
```

After:

```tsx
interface ReviewDetailsDrawerViewProps {
    presenter: ReviewDetailsPresenter.Interface;
    namespace: string;
```

Before:

```tsx
    const { presenter, useCases, reviewsUrl, onClose, onChanged } = props;
```

After:

```tsx
    const { presenter, namespace, reviewsUrl, onClose, onChanged } = props;
```

Before:

```tsx
            <ReviewActionDialogs
                useCases={useCases}
                request={request}
```

After:

```tsx
            <ReviewActionDialogs
                namespace={namespace}
                request={request}
```

Before:

```tsx
    const { useCases, reviewId, reviewsUrl, onClose, onChanged } = props;
    const { presenter } = useFeature(ReviewDetailsPresenterFeature);

    useEffect(() => {
        presenter.init({ useCases, reviewId, reviewsUrl, onClose, onChanged });
        return () => presenter.dispose();
    }, [presenter, reviewId]);

    return (
        <ReviewDetailsDrawerView
            presenter={presenter}
            useCases={useCases}
```

After:

```tsx
    const { namespace, reviewId, reviewsUrl, onClose, onChanged } = props;
    const { presenter } = useFeature(ReviewDetailsPresenterFeature);

    useEffect(() => {
        presenter.init({ namespace, reviewId, reviewsUrl, onClose, onChanged });
        return () => presenter.dispose();
    }, [presenter, reviewId]);

    return (
        <ReviewDetailsDrawerView
            presenter={presenter}
            namespace={namespace}
```

`packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`, before:

```tsx
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
```

After: the line is deleted. Before (as Task 10 left it):

```tsx
export interface ReviewBarProps {
    presenter: TargetReviewPresenter.Interface;
    // The action dialogs still take the app's use cases; Task 11 replaces this by the namespace.
    useCases: IReviewUseCases;
```

After:

```tsx
export interface ReviewBarProps {
    presenter: TargetReviewPresenter.Interface;
    // The namespace of the bar's target; the action dialogs run on it (R353, R363).
    namespace: string;
```

Before:

```tsx
    const { presenter, useCases, reviewsUrl, onOpenDetails } = props;
```

After:

```tsx
    const { presenter, namespace, reviewsUrl, onOpenDetails } = props;
```

Before:

```tsx
            <ReviewActionDialogs
                useCases={useCases}
                request={request}
```

After:

```tsx
            <ReviewActionDialogs
                namespace={namespace}
                request={request}
```

**3f. Editor session and bar.** `packages/app-workflows/src/review/editor/abstractions.ts` (whole file after):

```ts
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/*
 * One open editor's review state: its presenter. Each app declares its own token for it
 * (`CmsEntryReview`, `WbPageReview`) with `createAbstraction<IEditorReviewSession>` and binds a
 * subclass of `EditorReviewSession` to it (R237). The review use cases are injected by the
 * presenters, never carried here (R353).
 */
export interface IEditorReviewSession {
    readonly presenter: TargetReviewPresenter.Interface;
}
```

`packages/app-workflows/src/review/editor/EditorReviewSession.ts` (whole file after):

```ts
import type { IEditorReviewSession } from "./abstractions.js";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/*
 * The shared editor session, exported as a plain class: it is never passed to
 * `createImplementation` here. `createImplementation` writes the abstraction and the
 * dependencies onto the class itself, so each app subclasses this class once in its own file and
 * binds the subclass to its own token (R237).
 */
export class EditorReviewSession implements IEditorReviewSession {
    constructor(public readonly presenter: TargetReviewPresenter.Interface) {}
}
```

`packages/app-headless-cms-workflows/src/features/editorReview/CmsEntryReview.ts`, before:

```ts
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { CmsEntryReview as Abstraction } from "./abstractions.js";
```

After:

```ts
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsEntryReview as Abstraction } from "./abstractions.js";
```

Before:

```ts
    dependencies: [TargetReviewPresenter, CmsReviewUseCases]
```

After:

```ts
    dependencies: [TargetReviewPresenter]
```

`packages/app-website-builder-workflows/src/features/editorReview/WbPageReview.ts`: the same two hunks with `WbReviewUseCases` (`~/features/gateway/WbReviewUseCases/abstractions.js`).

`packages/app-workflows/src/review/editor/components/EditorReviewBar.tsx`, before:

```tsx
            <ReviewBar
                presenter={session.presenter}
                useCases={session.useCases}
                reviewsUrl={reviewsUrl}
                onOpenDetails={() => setDetailsReviewId(vm.reviewId)}
            />
            {detailsReviewId !== null && (
                <ReviewDetailsDrawer
                    useCases={session.useCases}
                    reviewId={detailsReviewId}
```

After:

```tsx
            <ReviewBar
                presenter={session.presenter}
                namespace={vm.namespace}
                reviewsUrl={reviewsUrl}
                onOpenDetails={() => setDetailsReviewId(vm.reviewId)}
            />
            {detailsReviewId !== null && (
                <ReviewDetailsDrawer
                    namespace={vm.namespace}
                    reviewId={detailsReviewId}
```

and the comment above the component gains one sentence: `The bar's target namespace, from the presenter's view model, routes the bar's dialogs and the drawer (R363).`

**3g. Row binding.** `packages/app-workflows/src/review/presentation/reviewList/abstractions.ts`, before:

```ts
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";

/*
 * What the list needs to know about one app for the rows of its namespace: the app's use cases
 * (row actions and the details drawer run on them), the content URL and the content type label.
 */
export interface IReviewRowBinding {
    readonly useCases: IReviewUseCases;
    getContentUrl(ref: ReviewContentRef): string;
```

After:

```ts
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";

/*
 * What the list needs to know about one app for the rows of its namespace: the content URL and
 * the content type label. Row actions and the details drawer run on the row's namespace (R353).
 */
export interface IReviewRowBinding {
    getContentUrl(ref: ReviewContentRef): string;
```

`packages/app-workflows/src/review/mounting/AppReviewRowProvider.ts` (whole file after):

```ts
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { IReviewRowBinding } from "~/review/presentation/reviewList/abstractions.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";

/*
 * Binds the shared list to one app: its content adapter. Exported as a plain class on purpose;
 * each app subclasses it in its own file and binds the subclass with `createImplementation`, so
 * two apps never share one class's metadata (R237).
 */
export class AppReviewRowProvider implements IReviewRowProvider {
    private readonly binding: IReviewRowBinding;

    constructor(private adapter: IReviewContentAdapter) {
        this.binding = {
            getContentUrl: ref => this.adapter.getContentUrl(ref),
            getContentTypeLabel: contentTypeId => this.adapter.getContentTypeLabel(contentTypeId)
        };
    }

    getBinding(namespace: string): IReviewRowBinding | null {
        if (!this.adapter.canHandle(namespace)) {
            return null;
        }
        return this.binding;
    }
}
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewRowProvider/CmsReviewRowProvider.ts` (whole file after):

```ts
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { CmsReviewContentAdapter } from "../CmsReviewContentAdapter/abstractions.js";
import { CmsReviewRowProvider as Abstraction } from "./abstractions.js";

// A subclass of its own: `createImplementation` stores the abstraction on the class, so the shared
// class must never be bound directly (it would collide with the Website Builder binding).
class CmsReviewRowProviderImpl extends AppReviewRowProvider implements Abstraction.Interface {}

export const CmsReviewRowProvider = Abstraction.createImplementation({
    implementation: CmsReviewRowProviderImpl,
    dependencies: [CmsReviewContentAdapter]
});
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewRowProvider/WbReviewRowProvider.ts`: the same change (delete the `WbReviewUseCases` import; `dependencies: [WbReviewContentAdapter]`).

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListDialogs.tsx`, before:

```tsx
/*
 * Mounts the row action dialog or the details drawer the presenter asks for, on the use cases of
 * the row's namespace. The list passes no `reviewsUrl`: it is Content Reviews itself (R214).
 */
```

After:

```tsx
/*
 * Mounts the row action dialog or the details drawer the presenter asks for, on the row's
 * namespace (R353), only for a namespace the row provider binds. The list passes no `reviewsUrl`:
 * it is Content Reviews itself (R214).
 */
```

Before:

```tsx
            <ReviewDetailsDrawer
                useCases={binding.useCases}
                reviewId={dialog.reviewId}
```

After:

```tsx
            <ReviewDetailsDrawer
                namespace={dialog.namespace}
                reviewId={dialog.reviewId}
```

Before:

```tsx
        <ReviewActionDialogs
            useCases={binding.useCases}
            request={request}
```

After:

```tsx
        <ReviewActionDialogs
            namespace={dialog.namespace}
            request={request}
```

- [ ] **Step 4: Run the tests to see them pass**

Run the eleven commands of Step 2 again, one at a time, then:

```bash
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/CmsRevisionsListPresenterDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. The CMS and WB `features/gateway/feature.test.ts` still resolve the old bundles through their per-app tokens (Task 14 removes them); only the row providers stopped depending on them.

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
git commit -m "refactor(app-workflows): inject the review use cases into the details drawer and the action dialogs" -m "The details, action and reassign presenters inject the use cases they call and take the review's namespace; the drawer, the dialogs, the review bar and the Content Reviews dialogs pass the namespace instead of a use-case bundle. The row binding and the editor session no longer carry use cases, so the CMS and Website Builder row providers and editor sessions depend only on their adapter and presenter (app-headless-cms-workflows, app-website-builder-workflows)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`PageReviewBar.tsx`** is in the contract's file list for this task, but R363 leaves it unchanged here: it renders `EditorReviewBar`, which now reads the namespace from the session presenter's view model, and its `init` call already lost `useCases` in Task 10.
- **More tests than listed.** Removing `useCases` from `IReviewRowBinding` makes every hand-built row binding in the list and widget tests drop that field to compile (`ReviewListPresenter.test.ts`, `reviewListPure.test.ts`, `ReviewWidgetPresenter.test.ts`, `ReviewWidgets.test.tsx`), and the bar tests of Task 10 (`ReviewBar.test.tsx`, `RequestReviewDialog.test.tsx`) switch to the `namespace` prop. The CMS `contentReviewsBindings.test.ts` needs no edit; it only runs.
- **Shared fakes.** `createReviewUseCaseFakes` returns one `{ execute }` fake per use case by name and `registerReviewUseCaseFakes` registers them (R355's "wiring helper"); neither exposes an object that implements several operations. The two functions live in two files (one public function per file).
- **Presenter field names.** The presenters hold their use cases as `<name>UseCase` fields (`getReviewUseCase`), the base form (`deletePageUseCase` in WB `BulkDeletePresenter`), so they never clash with state fields such as `comment` or `notify`.

## Review fixes (sub-phase review)

1. Hoisted nested call arguments out of the rewritten setups (`ReviewDetailsPresenter.test.ts` `createSetup`: `review`, `flags`, `identityContext` locals; `ReviewActionDialogPresenter.test.ts`: `review`, `flags`; `ReviewActionDialogs.test.tsx` `createUseCases` tail: `flags`; `EditorReviewBar.test.tsx` `createSession`: `flags`).
2. Replaced the added R357 presenter case: the old one duplicated the existing "does not subscribe after a failed first load and subscribes once a retry succeeds" and "subscribes with the namespace of the loaded review, after the first load" cases. The new case pins what R357 adds: with a namespace in the init params, the subscription still waits for the load and uses the loaded review's namespace, while `getReview` is called with the init namespace.
3. Fixed the 1c `sed`: its last rule turned `useCases={useCases}` into `fakes={fakes}`, contradicting the worked example (`useCases={fakes}`) and step 4; it now leaves JSX attributes (`[^A-Za-z=]`) for the manual step.
4. `EditorReviewBar.test.tsx`: added the exact import and `renderBar` before/after hunks, and stated that every case destructures `fakes` because every render passes it.
5. Resolved the `verify:` note of the drawer's R363 case (checked at HEAD: step `s2` "Legal sign-off", dialog `Start “Legal sign-off”?`, confirm via `getAllByText(...).pop()`).
