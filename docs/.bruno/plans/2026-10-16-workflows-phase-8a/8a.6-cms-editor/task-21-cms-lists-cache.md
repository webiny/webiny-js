### Task 21: CMS lists and cache writer (field selections, row mapper, Move gate, cache writer)

Spec 13.1, 13.3; R202, R211, R213, R226, R229 (rows only), Review Focus 1, 8, 16, 17; D60, D70, D119; QBZ-36 (Move disabled while in review), QBZ-58 (only approved or no-workflow rows are selectable for bulk actions). This task moves the CMS entry list and the entries cache from the old workflow-state shape to the review shape: the list and entry reads select `meta.system.workflow { workflowId reviewState stepId stepName stepState }` through the one shared constant, the table row mapper keeps a row selectable only when its review is approved or it has none, the list's per-row "Move" action is disabled with the shared reason while the row's review is in progress, and a `CmsReviewCacheWriter` is the only CMS-specific part of the shared `ReviewCacheSyncHandler` (Task 10): when the shared presenter publishes `ReviewChangedEvent` (after every settled load, Task 13), the writer puts the new `meta.system.workflow` into the entries cache so the list reflects it without a refetch. All imports from `app-workflows` use deep paths (controller rule).

- **Selections (D70):** `ListEntriesGraphQLFieldSelection` and `GetEntryGraphQLFieldSelection` implementations returning `meta { system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } } }`. The server type is `CmsEntrySystemWorkflow { workflowId reviewState stepId stepName stepState }` (`packages/api-headless-cms-workflows/src/graphql/entrySystemSchema.ts`); the old selection asked for a field `state` that no longer exists.
- **Row mapper:** `TableRowMapper` decorator; `$selectable` becomes `false` when `isReviewSelectable(reviewState)` is false (a review that is not approved: in progress, rejected, cancelled). A row with no `meta.system.workflow`, or already unselectable in the base, is returned unchanged.
- **Move gate (QBZ-36):** a decorator of `ContentEntryListConfig.Browser.Entry.Action` (`EntryAction`, `packages/app-headless-cms/src/admin/config/contentEntries/list/Browser/EntryAction.tsx`, `makeDecoratable`; the base registers the action `move` with `MoveEntry`) that, for `props.name === "move"` only, reads the row's entry with `useEntry()` and, when `meta.system.workflow.reviewState` is `ReviewState.InProgress`, renders a disabled "Move" `OptionsMenuItem` with the reason "Can’t move while this revision is in review." (`MOVE_BLOCKED_IN_REVIEW`, exported by Task 13 from `targetReview/moveBlockedInReview.ts`, R250) given on hover through `Tooltip` and to assistive technology through `aria-describedby` and a visually hidden element. Every other action and every other review state renders the original.
- **Cache writer:** `canHandle` = `isCmsAppName`; `write(ref, workflow)` updates the entry in `ContentEntriesCacheProvider.get(modelId)` whose `entryId` equals the entry id parsed from `ref.targetRevisionId` (R213, so the writer does not depend on how `targetId` is filled; it merges the value into the existing `meta.system`) and sets `meta.system.workflow`, keeping every other `meta` and `meta.system` key.
- **Registration:** per the subclass rule the shared `ReviewCacheSyncHandler` is never registered: `class CmsReviewCacheSyncHandlerImpl extends ReviewCacheSyncHandler implements ReviewChangedHandler.Interface {}` registered with `ReviewChangedHandler.createImplementation({ implementation, dependencies: [CmsReviewCacheWriter] })`. `CmsWorkflowsCacheFeature` registers the writer and the handler; `CmsWorkflowsFeature` registers the selections and the row mapper decorator; the root mounts the Move gate decorator (it is a component decorator, like Task 20's).

**Files:**
- Create: `packages/app-headless-cms-workflows/src/presentation/CmsReviewListEntriesFieldSelection.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/CmsReviewGetEntryFieldSelection.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/CmsReviewTableRowMapperDecorator.ts`
- Create: `packages/app-headless-cms-workflows/src/Components/CmsEntriesList/CmsReviewMoveEntryAction.tsx`
- Create: `packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriter.ts` (token, one abstraction per file)
- Create: `packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriterImpl.ts`
- Create: `packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheSyncHandlerImpl.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/feature.ts` (`CmsWorkflowsCacheFeature`, existing)
- Modify: `packages/app-headless-cms-workflows/src/presentation/feature.ts` (`CmsWorkflowsFeature`, already changed by Task 20)
- Modify: `packages/app-headless-cms-workflows/package.json` (add `"@webiny/app-aco": "0.0.0"` to `devDependencies`, alphabetical, before `@webiny/build-tools`; the Move and root tests `vi.mock("@webiny/app-aco", ...)` and no source file imports it; the repo convention is the exact version `"0.0.0"` as in `packages/app-headless-cms/package.json`)
- Modify: `packages/app-headless-cms-workflows/src/types.ts` (typing of `meta.system.workflow`; the old types stay until Task 37)
- Modify: `packages/app-headless-cms-workflows/src/index.tsx` (mounts the Move gate; the cache and presentation features are already registered by it)
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx` (**Task 11's file**, edited only to add one `vi.mock` for the new component, which needs a composition provider that test does not mount)
- Create tests: `src/presentation/CmsReviewFieldSelections.test.ts`, `src/presentation/CmsReviewTableRowMapperDecorator.test.ts`, `src/Components/CmsEntriesList/CmsReviewMoveEntryAction.test.tsx`, `src/features/cache/CmsReviewCacheWriterImpl.test.ts`, `src/index.lists.test.tsx`
- Not touched, deleted in Task 37: `presentation/{WorkflowStateListEntriesFieldSelection,WorkflowStateGetEntryFieldSelection,TableRowMapperWorkflowDecorator}.ts`, `features/WorkflowStateCacheHandler.ts`. They stop being registered here; `ICmsEntryWorkflowState` and `ICmsEntrySystemWithWorkflow` in `types.ts` stay because those old files still import them.
- Existing, must stay green unchanged: the test files of Task 20 and every test file Task 11 added under `packages/app-headless-cms-workflows`.

**Interfaces:**
- Consumes: Task 8 (`REVIEW_SYSTEM_WORKFLOW_SELECTION` `.../review/gateway/reviewFields.js`, `isReviewSelectable` `.../review/domain/isReviewSelectable.js`, `toSystemWorkflow` `.../review/domain/toSystemWorkflow.js`, `IReviewCacheWriter` and `ReviewCacheRef` `.../review/cache/IReviewCacheWriter.js`, `SystemWorkflowValue` `.../review/domain/types.js`, `ReviewState` `.../review/domain/ReviewState.js`, `StepState` `.../review/domain/StepState.js`), Task 10 (`ReviewCacheSyncHandler` `.../review/cache/ReviewCacheSyncHandler.js`, `ReviewChangedHandler` `.../review/events/ReviewChangedHandler.js`, `ReviewChangedEvent` `.../review/events/ReviewChangedEvent.js`), Task 13 (`MOVE_BLOCKED_IN_REVIEW` in `.../review/presentation/targetReview/moveBlockedInReview.js`), Task 8 (the pure builder `createReview` in `.../review/testing/reviewFixtures.js`, importable across packages because `src/review/testing` ships in `dist`, R243), Task 20 (`src/testing/models.ts`, the DOM setup, the `vi.mock` stubs reused in `index.lists.test.tsx`). Existing, verified in code for this plan: `ListEntriesGraphQLFieldSelection`, `GetEntryGraphQLFieldSelection`, `TableRowMapper`, `ContentEntryListConfig` (`@webiny/app-headless-cms/exports/admin/cms/entry/list.js`; abstractions are `getSelection(): string[]` and `fromEntry(entry): IEntryTableRow`), `ContentEntriesCacheProvider` (`@webiny/app-headless-cms/features/contentEntry/abstractions.js`; `get(modelId)` returns an `IListCache<CmsContentEntry>` with `updateItems`, `setItems`, `getItem`; implementation `.../features/contentEntry/ContentEntriesCacheProvider.js`), `useEntry` and `EntryProvider` (`@webiny/app-headless-cms/admin/hooks/useEntry.js`), `OptionsMenuItem` (`@webiny/app-admin`, props `onAction`, `disabled`, `icon`, `label`), `Tooltip` (`@webiny/admin-ui`), `@webiny/icons/exit_to_app.svg` (the base `MoveEntry` icon), `parseIdentifier` (`@webiny/utils/parseIdentifier.js`), `isCmsAppName` and `parseAppName` (`src/utils/appName.ts`), `CmsContentEntry` (`@webiny/app-headless-cms-common/types/index.js`; its `meta` has no `system`, hence the local `ICmsEntryMetaWithReview`).
- Produces: `CmsReviewListEntriesFieldSelection`, `CmsReviewGetEntryFieldSelection`, `CmsReviewTableRowMapperDecorator`, `CmsReviewMoveEntryAction`, `CmsReviewCacheWriter` (token `"Cms/Workflows/ReviewCacheWriter"` in `CmsReviewCacheWriter.ts`, implementation `CmsReviewCacheWriterImpl` exported as `CmsReviewCacheWriter` from `CmsReviewCacheWriterImpl.ts`), `CmsReviewCacheSyncHandler`, `ICmsEntrySystemWithReview`, `ICmsEntryMetaWithReview`. Task 37 deletes the old files and the old types they use.

- [ ] **Step 1: Write the failing tests**

First add `"@webiny/app-aco": "0.0.0"` to `devDependencies` of `packages/app-headless-cms-workflows/package.json` (the Move and root tests mock that package), then run `yarn > /dev/null 2>&1` so the workspace link resolves.

Create `packages/app-headless-cms-workflows/src/presentation/CmsReviewFieldSelections.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ListEntriesGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { CmsReviewGetEntryFieldSelection } from "~/presentation/CmsReviewGetEntryFieldSelection.js";
import { CmsReviewListEntriesFieldSelection } from "~/presentation/CmsReviewListEntriesFieldSelection.js";

const EXPECTED = `meta { system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } } }`;

describe("CMS review field selections", () => {
    it("selects the review shape of system.workflow on the entry list", () => {
        const container = new Container();
        container.register(CmsReviewListEntriesFieldSelection);

        const selection = container.resolve(ListEntriesGraphQLFieldSelection).getSelection();

        expect(selection).toEqual([EXPECTED]);
    });

    it("selects the review shape of system.workflow on an entry read", () => {
        const container = new Container();
        container.register(CmsReviewGetEntryFieldSelection);

        const selection = container.resolve(GetEntryGraphQLFieldSelection).getSelection();

        expect(selection).toEqual([EXPECTED]);
    });

    it("asks for the server's review fields and not the removed state field", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
        expect(EXPECTED).not.toMatch(/\bstate\b/);
    });
});
```

Create `packages/app-headless-cms-workflows/src/presentation/CmsReviewTableRowMapperDecorator.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { CmsReviewTableRowMapperDecorator } from "~/presentation/CmsReviewTableRowMapperDecorator.js";

interface BaseState {
    selectable: boolean;
}

let base: BaseState;

class FakeRowMapper implements TableRowMapper.Interface {
    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        return { id: entry.id, $selectable: base.selectable, $type: "RECORD", data: entry };
    }
}

const BaseRowMapper = TableRowMapper.createImplementation({
    implementation: FakeRowMapper,
    dependencies: []
});

function createEntry(system: unknown): CmsContentEntry {
    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status: "draft", version: 1, locked: false, system }
    } as unknown as CmsContentEntry;
}

function createWorkflow(reviewState: string) {
    return {
        workflowId: "wf-1",
        reviewState,
        stepId: "step-1",
        stepName: "Legal review",
        stepState: "inReview"
    };
}

let mapper: TableRowMapper.Interface;

describe("CmsReviewTableRowMapperDecorator", () => {
    beforeEach(() => {
        base = { selectable: true };
        const container = new Container();
        container.register(BaseRowMapper);
        container.registerDecorator(CmsReviewTableRowMapperDecorator);
        mapper = container.resolve(TableRowMapper);
    });

    it("keeps an approved review selectable", () => {
        const row = mapper.fromEntry(createEntry({ workflow: createWorkflow(ReviewState.Approved) }));

        expect(row.$selectable).toBe(true);
    });

    it.each([
        ["in progress", ReviewState.InProgress],
        ["rejected", ReviewState.Rejected],
        ["cancelled", ReviewState.Cancelled]
    ])("makes a row with a %s review unselectable", (_name, reviewState) => {
        const row = mapper.fromEntry(createEntry({ workflow: createWorkflow(reviewState) }));

        expect(row.$selectable).toBe(false);
    });

    it.each([
        ["no system", undefined],
        ["a null system", null],
        ["a system without a workflow", {}],
        ["a null workflow", { workflow: null }]
    ])("keeps a row with %s selectable", (_name, system) => {
        const row = mapper.fromEntry(createEntry(system));

        expect(row.$selectable).toBe(true);
    });

    it("never makes selectable what the base mapper made unselectable", () => {
        base.selectable = false;

        const row = mapper.fromEntry(createEntry({ workflow: createWorkflow(ReviewState.Approved) }));

        expect(row.$selectable).toBe(false);
    });

    it("keeps the rest of the row", () => {
        const entry = createEntry({ workflow: createWorkflow(ReviewState.InProgress) });

        const row = mapper.fromEntry(entry);

        expect(row.id).toBe("entry-1#0001");
        expect(row.$type).toBe("RECORD");
        expect(row.data).toBe(entry);
    });
});
```

Create `packages/app-headless-cms-workflows/src/Components/CmsEntriesList/CmsReviewMoveEntryAction.test.tsx` (the base `EntryAction` renders ACO's `Record.Action`, which needs the ACO list config; the test replaces only that leaf with a probe, so the real `EntryAction`, its decorator mechanics and the entry context stay in play):

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { EntryProvider } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { MOVE_BLOCKED_IN_REVIEW } from "@webiny/app-workflows/review/presentation/targetReview/moveBlockedInReview.js";
import { CmsReviewMoveEntryAction } from "./CmsReviewMoveEntryAction.js";
import { MODEL } from "~/testing/models.js";

interface FakeActionProps {
    name: string;
    element: React.ReactElement;
}

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
}

vi.mock("@webiny/app-aco", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-aco")>();
    const React = await import("react");
    const Action = Object.assign(
        (props: FakeActionProps) => {
            return React.createElement("div", { "data-action": props.name }, props.element);
        },
        { OptionsMenuItem: () => null, OptionsMenuLink: () => null }
    );

    return {
        ...actual,
        AcoConfig: {
            ...actual.AcoConfig,
            Record: { ...actual.AcoConfig.Record, Action }
        }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement(
                "button",
                { "data-testid": "blocked-move", disabled: props.disabled ?? false },
                props.label
            );
        }
    };
});

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

function createEntry(reviewState: string | null): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status: "draft", version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

function renderActions(entry: CmsContentEntry) {
    return render(
        <AdminUiProvider>
            <CompositionProvider>
                <ModelContext.Provider value={MODEL}>
                    <EntryProvider entry={entry}>
                        <CmsReviewMoveEntryAction />
                        <EntryAction name="move" element={<span data-testid="move-item" />} />
                        <EntryAction name="delete" element={<span data-testid="delete-item" />} />
                    </EntryProvider>
                </ModelContext.Provider>
            </CompositionProvider>
        </AdminUiProvider>
    );
}

describe("CmsReviewMoveEntryAction", () => {
    it("replaces Move with a disabled item and its reason while the review is in progress", async () => {
        renderActions(createEntry(ReviewState.InProgress));

        const blocked = await screen.findByTestId("blocked-move");

        expect(blocked.textContent).toBe("Move");
        expect(blocked.hasAttribute("disabled")).toBe(true);
        expect(screen.queryByTestId("move-item")).toBeNull();
        const describedBy = blocked.closest("[aria-describedby]")?.getAttribute("aria-describedby");
        expect(document.getElementById(describedBy ?? "")?.textContent).toBe(
            MOVE_BLOCKED_IN_REVIEW
        );
    });

    it("leaves the other actions of the same row alone while the review is in progress", async () => {
        renderActions(createEntry(ReviewState.InProgress));

        expect(await screen.findByTestId("delete-item")).toBeTruthy();
    });

    it.each([
        ["approved", ReviewState.Approved],
        ["rejected", ReviewState.Rejected],
        ["cancelled", ReviewState.Cancelled],
        ["missing", null]
    ])("keeps the original Move for a %s review", async (_name, reviewState) => {
        renderActions(createEntry(reviewState));

        expect(await screen.findByTestId("move-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-move")).toBeNull();
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriterImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { ContentEntriesCacheProvider as ContentEntriesCacheProviderImpl } from "@webiny/app-headless-cms/features/contentEntry/ContentEntriesCacheProvider.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { toSystemWorkflow } from "@webiny/app-workflows/review/domain/toSystemWorkflow.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import { ReviewChangedEvent } from "@webiny/app-workflows/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { createReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { CmsReviewCacheWriter as Abstraction } from "~/features/cache/CmsReviewCacheWriter.js";
import { CmsReviewCacheWriter } from "~/features/cache/CmsReviewCacheWriterImpl.js";
import { CmsReviewCacheSyncHandler } from "~/features/cache/CmsReviewCacheSyncHandlerImpl.js";

const WORKFLOW: SystemWorkflowValue = {
    workflowId: "wf-1",
    reviewState: ReviewState.InProgress,
    stepId: "step-1",
    stepName: "Legal review",
    stepState: StepState.InReview
};

function createEntry(entryId: string, system: Record<string, unknown> | undefined): CmsContentEntry {
    return {
        id: `${entryId}#0001`,
        entryId,
        meta: { title: entryId, status: "draft", version: 1, locked: false, system }
    } as unknown as CmsContentEntry;
}

function getSystem(entry: CmsContentEntry | undefined): unknown {
    return (entry?.meta as unknown as { system?: unknown }).system;
}

let container: Container;

function seedCache(modelId: string, entries: CmsContentEntry[]): void {
    const provider = container.resolve(ContentEntriesCacheProvider);
    provider.get(modelId).setItems(entries);
}

function readCache(modelId: string, entryId: string): CmsContentEntry | undefined {
    const provider = container.resolve(ContentEntriesCacheProvider);
    return provider.get(modelId).getItem(entry => entry.entryId === entryId);
}

beforeEach(() => {
    container = new Container();
    container.register(ContentEntriesCacheProviderImpl).inSingletonScope();
    container.register(CmsReviewCacheWriter);
    container.register(CmsReviewCacheSyncHandler);
});

describe("CmsReviewCacheWriter", () => {
    it("handles CMS namespaces only", () => {
        const writer = container.resolve(Abstraction);

        expect(writer.canHandle("cms.article")).toBe(true);
        expect(writer.canHandle("wb.page")).toBe(false);
        expect(writer.canHandle("cms")).toBe(false);
    });

    it("writes meta.system.workflow into the matching entry only", () => {
        seedCache("article", [createEntry("entry-1", undefined), createEntry("entry-2", undefined)]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0003" },
            WORKFLOW
        );

        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: WORKFLOW });
        expect(getSystem(readCache("article", "entry-2"))).toBeUndefined();
    });

    it("keeps the other meta fields and the other system keys", () => {
        seedCache("article", [createEntry("entry-1", { other: "kept", workflow: null })]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            WORKFLOW
        );

        const entry = readCache("article", "entry-1");
        expect(getSystem(entry)).toEqual({ other: "kept", workflow: WORKFLOW });
        expect(entry?.meta.title).toBe("entry-1");
        expect(entry?.meta.status).toBe("draft");
    });

    it("clears the workflow when the review is gone", () => {
        seedCache("article", [createEntry("entry-1", { workflow: WORKFLOW })]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            null
        );

        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: null });
    });

    it("does not touch the cache of another model", () => {
        seedCache("article", [createEntry("entry-1", undefined)]);
        seedCache("page", [createEntry("entry-1", undefined)]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            WORKFLOW
        );

        expect(getSystem(readCache("page", "entry-1"))).toBeUndefined();
    });
});

describe("CmsReviewCacheSyncHandler", () => {
    function resolveHandler() {
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(1);
        return handlers[0];
    }

    it("is registered as a subclass of the shared handler", () => {
        const handler = resolveHandler();

        expect(handler.constructor.name).toBe("CmsReviewCacheSyncHandlerImpl");
    });

    it("stores toSystemWorkflow of the changed review", async () => {
        seedCache("article", [createEntry("entry-1", undefined)]);
        const review = createReview({ namespace: "cms.article" });
        const expected = toSystemWorkflow(review);
        const event = new ReviewChangedEvent({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review
        });

        await resolveHandler().handle(event);

        expect(expected).not.toBeNull();
        expect(expected?.workflowId).toBe(review.workflowId);
        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: expected });
    });

    it("clears the workflow when the event carries no review", async () => {
        seedCache("article", [createEntry("entry-1", { workflow: WORKFLOW })]);
        const event = new ReviewChangedEvent({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review: null
        });

        await resolveHandler().handle(event);

        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: null });
    });

    it("ignores another app's namespace", async () => {
        seedCache("article", [createEntry("entry-1", undefined)]);
        const event = new ReviewChangedEvent({
            namespace: "wb.page",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review: createReview({ namespace: "wb.page" })
        });

        await resolveHandler().handle(event);

        expect(getSystem(readCache("article", "entry-1"))).toBeUndefined();
    });
});
```

Create `packages/app-headless-cms-workflows/src/index.lists.test.tsx` (the same stubs as Task 20's `index.editor.test.tsx`; copy any further stub Task 11 or 20 needed):

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/react-composition";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ContentEntryEditorWithConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { EntryProvider } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { ContentEntriesCacheProvider as ContentEntriesCacheProviderImpl } from "@webiny/app-headless-cms/features/contentEntry/ContentEntriesCacheProvider.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ListEntriesGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { toSystemWorkflow } from "@webiny/app-workflows/review/domain/toSystemWorkflow.js";
import { ReviewChangedEvent } from "@webiny/app-workflows/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { createReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { CmsWorkflows } from "./index.js";
import { MODEL } from "~/testing/models.js";

interface FakeActionProps {
    name: string;
    element: React.ReactElement;
}

interface FakeMenuItemProps {
    label: string;
}

vi.mock("@webiny/app-aco", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-aco")>();
    const React = await import("react");
    const Action = Object.assign(
        (props: FakeActionProps) => {
            return React.createElement("div", { "data-action": props.name }, props.element);
        },
        { OptionsMenuItem: () => null, OptionsMenuLink: () => null }
    );

    return {
        ...actual,
        AcoConfig: { ...actual.AcoConfig, Record: { ...actual.AcoConfig.Record, Action } }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement("button", { "data-testid": "blocked-move" }, props.label);
        }
    };
});

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowsEditor: () => null };
});

vi.mock("~/Components/CmsEntriesWorkflowStateList/index.js", () => {
    return { CmsEntriesWorkflowStateListFooterMenu: () => null };
});

vi.mock("~/Components/OptionItem/OpenInNewWindow.js", () => {
    return { ListOpenInNewWindow: () => null };
});

vi.mock("~/presentation/cmsWorkflowsEditor/feature.js", () => {
    return {
        CmsWorkflowsEditorPresenterFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

class FakeRowMapper implements TableRowMapper.Interface {
    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        return { id: entry.id, $selectable: true, $type: "RECORD", data: entry };
    }
}

const BaseRowMapper = TableRowMapper.createImplementation({
    implementation: FakeRowMapper,
    dependencies: []
});

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

function createEntry(reviewState: string | null): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status: "draft", version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

function mountRoot(isEnabled: boolean): Container {
    const flagsService: FeatureFlagsService.Interface = {
        getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    };
    const container = new Container();
    container.registerInstance(FeatureFlagsService, flagsService);
    container.register(ContentEntriesCacheProviderImpl).inSingletonScope();
    container.register(BaseRowMapper);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={MODEL}>
                        <ContentEntryEditorWithConfig>
                            <CmsWorkflows />
                            <EntryProvider entry={createEntry("inProgress")}>
                                <EntryAction name="move" element={<span data-testid="move-item" />} />
                            </EntryProvider>
                        </ContentEntryEditorWithConfig>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return container;
}

function getCachedSystem(container: Container): unknown {
    const provider = container.resolve(ContentEntriesCacheProvider);
    const entry = provider.get("article").getItem(item => item.entryId === "entry-1");
    return (entry?.meta as unknown as { system?: unknown }).system;
}

describe("CmsWorkflows list and cache wiring", () => {
    it("registers the selections, the row mapper, the Move gate and the cache sync with the flag on", async () => {
        const container = mountRoot(true);

        const listSelections = container
            .resolveAll(ListEntriesGraphQLFieldSelection)
            .flatMap(selection => selection.getSelection());
        const getSelections = container
            .resolveAll(GetEntryGraphQLFieldSelection)
            .flatMap(selection => selection.getSelection());
        expect(listSelections).toHaveLength(1);
        expect(listSelections[0]).toContain("reviewState");
        expect(getSelections).toHaveLength(1);
        expect(getSelections[0]).toContain("stepState");

        const mapper = container.resolve(TableRowMapper);
        expect(mapper.fromEntry(createEntry("inProgress")).$selectable).toBe(false);
        expect(mapper.fromEntry(createEntry(null)).$selectable).toBe(true);

        expect(await screen.findByTestId("blocked-move")).toBeTruthy();
        expect(screen.queryByTestId("move-item")).toBeNull();

        const provider = container.resolve(ContentEntriesCacheProvider);
        provider.get("article").setItems([createEntry(null)]);
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(1);
        const review = createReview({ namespace: "cms.article" });
        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                review
            })
        );
        expect(getCachedSystem(container)).toEqual({ workflow: toSystemWorkflow(review) });
    });

    it("registers none of it with the flag off", async () => {
        const container = mountRoot(false);

        expect(container.resolveAll(ListEntriesGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(GetEntryGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(ReviewChangedHandler)).toHaveLength(0);

        const mapper = container.resolve(TableRowMapper);
        expect(mapper.fromEntry(createEntry("inProgress")).$selectable).toBe(true);

        expect(await screen.findByTestId("move-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-move")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the new tests, expect failure**

Admin packages run `yarn test <path>` only (no storage is involved in `app-*` packages). One file per command:

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/CmsReviewFieldSelections.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/presentation/CmsReviewTableRowMapperDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/CmsEntriesList/CmsReviewMoveEntryAction.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -50
```

Expected: the first four FAIL to load with `Failed to resolve import "~/presentation/CmsReviewGetEntryFieldSelection.js"`, `"~/presentation/CmsReviewTableRowMapperDecorator.js"`, `"./CmsReviewMoveEntryAction.js"` and `"~/features/cache/CmsReviewCacheWriter.js"`. `index.lists.test.tsx` loads (Task 20 is applied) and FAILS its assertions: the flag-on case finds the old selection (`state`, no `reviewState`), no Move gate and no `ReviewChangedHandler`. If a failure names an `@webiny/app-workflows` path or export (`MOVE_BLOCKED_IN_REVIEW`, `REVIEW_SYSTEM_WORKFLOW_SELECTION`, `isReviewSelectable`, `ReviewCacheSyncHandler`, `ReviewChangedHandler`) as missing, Tasks 8, 10 or 13 are not applied: stop.

- [ ] **Step 3: Implement**

`packages/app-headless-cms-workflows/src/types.ts`: keep the two existing interfaces unchanged (the old files that use them are deleted in Task 37) and add the two imports at the top of the file and the new interfaces below the old ones:

```ts
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
```

```ts
export interface ICmsEntrySystemWithReview {
    workflow?: SystemWorkflowValue | null;
}

/*
 * `CmsContentEntry["meta"]` does not declare `system`, but the entry list and entry reads select
 * `meta.system.workflow` (see the field selections).
 */
export interface ICmsEntryMetaWithReview extends CmsContentEntry["meta"] {
    system?: ICmsEntrySystemWithReview | null;
}
```

`packages/app-headless-cms-workflows/src/presentation/CmsReviewListEntriesFieldSelection.ts`:

```ts
import { ListEntriesGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";

class CmsReviewListEntriesFieldSelectionImpl implements ListEntriesGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [`meta { system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } } }`];
    }
}

export const CmsReviewListEntriesFieldSelection =
    ListEntriesGraphQLFieldSelection.createImplementation({
        dependencies: [],
        implementation: CmsReviewListEntriesFieldSelectionImpl
    });
```

`packages/app-headless-cms-workflows/src/presentation/CmsReviewGetEntryFieldSelection.ts`:

```ts
import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";

class CmsReviewGetEntryFieldSelectionImpl implements GetEntryGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [`meta { system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } } }`];
    }
}

export const CmsReviewGetEntryFieldSelection = GetEntryGraphQLFieldSelection.createImplementation({
    dependencies: [],
    implementation: CmsReviewGetEntryFieldSelectionImpl
});
```

`packages/app-headless-cms-workflows/src/presentation/CmsReviewTableRowMapperDecorator.ts`:

```ts
import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";

class CmsReviewTableRowMapper implements TableRowMapper.Interface {
    constructor(private readonly decoratee: TableRowMapper.Interface) {}

    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        const row = this.decoratee.fromEntry(entry);
        const meta: ICmsEntryMetaWithReview = entry.meta;
        const reviewState = meta.system?.workflow?.reviewState ?? null;

        if (isReviewSelectable(reviewState)) {
            return row;
        }

        return { ...row, $selectable: false };
    }
}

export const CmsReviewTableRowMapperDecorator = TableRowMapper.createDecorator({
    decorator: CmsReviewTableRowMapper,
    dependencies: []
});
```

`packages/app-headless-cms-workflows/src/Components/CmsEntriesList/CmsReviewMoveEntryAction.tsx`:

```tsx
import React, { useId } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { OptionsMenuItem } from "@webiny/app-admin";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { MOVE_BLOCKED_IN_REVIEW } from "@webiny/app-workflows/review/presentation/targetReview/moveBlockedInReview.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

function ignoreAction(): void {}

/*
 * A disabled menu item cannot take focus, so the reason is given on hover by the tooltip and to
 * assistive technology by `aria-describedby` on a visually hidden element that is always present
 * (the same pattern as the shared `ReviewTooltip`, which needs a review presenter the list does not
 * have).
 */
const MoveBlocked = () => {
    const descriptionId = useId();

    return (
        <span aria-describedby={descriptionId}>
            <Tooltip
                content={MOVE_BLOCKED_IN_REVIEW}
                trigger={
                    <OptionsMenuItem
                        icon={<MoveIcon />}
                        label={"Move"}
                        disabled={true}
                        onAction={ignoreAction}
                    />
                }
            />
            <span id={descriptionId} className={"sr-only"}>
                {MOVE_BLOCKED_IN_REVIEW}
            </span>
        </span>
    );
};

interface MoveGateProps {
    children: React.ReactElement;
}

const MoveGate = createReactiveComponent((props: MoveGateProps) => {
    const { entry } = useEntry();
    const meta: ICmsEntryMetaWithReview = entry.meta;

    if (meta.system?.workflow?.reviewState === ReviewState.InProgress) {
        return <MoveBlocked />;
    }

    return props.children;
});

/*
 * Only the per-row "Move" action is gated. Moving by drag and drop and `MoveEntryUseCase` are not
 * gated in 8a (R250, Contract note 2).
 */
export const CmsReviewMoveEntryAction = EntryAction.createDecorator(Original => {
    return function CmsReviewMoveEntryActionDecorator(props) {
        if (props.name !== "move") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<MoveGate>{props.element}</MoveGate>} />;
    };
});
```

`packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriter.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewCacheWriter } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";

export const CmsReviewCacheWriter = createAbstraction<IReviewCacheWriter>(
    "Cms/Workflows/ReviewCacheWriter"
);

export namespace CmsReviewCacheWriter {
    export type Interface = IReviewCacheWriter;
}
```

`packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriterImpl.ts`:

```ts
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { ReviewCacheRef } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import { isCmsAppName } from "~/utils/appName.js";
import { parseAppName } from "~/utils/appName.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";
import { CmsReviewCacheWriter as Abstraction } from "./CmsReviewCacheWriter.js";

class CmsReviewCacheWriterImpl implements Abstraction.Interface {
    constructor(private readonly cacheProvider: ContentEntriesCacheProvider.Interface) {}

    canHandle(namespace: string): boolean {
        return isCmsAppName(namespace);
    }

    write(ref: ReviewCacheRef, workflow: SystemWorkflowValue | null): void {
        const modelId = parseAppName(ref.namespace);
        const { id: entryId } = parseIdentifier(ref.targetRevisionId);
        const cache = this.cacheProvider.get(modelId);

        cache.updateItems((entry: CmsContentEntry) => {
            if (entry.entryId !== entryId) {
                return entry;
            }

            const current: ICmsEntryMetaWithReview = entry.meta;
            const meta: ICmsEntryMetaWithReview = {
                ...entry.meta,
                system: { ...current.system, workflow }
            };

            return { ...entry, meta };
        });
    }
}

export const CmsReviewCacheWriter = Abstraction.createImplementation({
    implementation: CmsReviewCacheWriterImpl,
    dependencies: [ContentEntriesCacheProvider]
});
```

`packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheSyncHandlerImpl.ts`:

```ts
import { ReviewCacheSyncHandler } from "@webiny/app-workflows/review/cache/ReviewCacheSyncHandler.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { CmsReviewCacheWriter } from "./CmsReviewCacheWriter.js";

/*
 * The shared handler is never registered itself: `createImplementation` stores the abstraction and
 * dependencies on the class, so each app subclasses it once (R237).
 */
class CmsReviewCacheSyncHandlerImpl
    extends ReviewCacheSyncHandler
    implements ReviewChangedHandler.Interface {}

export const CmsReviewCacheSyncHandler = ReviewChangedHandler.createImplementation({
    implementation: CmsReviewCacheSyncHandlerImpl,
    dependencies: [CmsReviewCacheWriter]
});
```

`packages/app-headless-cms-workflows/src/features/feature.ts` (replace the whole file):

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsReviewCacheSyncHandler } from "./cache/CmsReviewCacheSyncHandlerImpl.js";
import { CmsReviewCacheWriter } from "./cache/CmsReviewCacheWriterImpl.js";

export const CmsWorkflowsCacheFeature = createFeature({
    name: "CmsWorkflows/Cache",
    register(container) {
        container.register(CmsReviewCacheWriter);
        container.register(CmsReviewCacheSyncHandler);
    }
});
```

`packages/app-headless-cms-workflows/src/presentation/feature.ts` (replace the whole file; Task 20 already swapped the presenter decorator):

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsEntryFormPresenterReviewDecorator } from "./CmsEntryFormPresenterReviewDecorator.js";
import { CmsReviewGetEntryFieldSelection } from "./CmsReviewGetEntryFieldSelection.js";
import { CmsReviewListEntriesFieldSelection } from "./CmsReviewListEntriesFieldSelection.js";
import { CmsReviewTableRowMapperDecorator } from "./CmsReviewTableRowMapperDecorator.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // WorkflowsFeature and the review services are registered by WorkflowsAdminApp.
        container.registerDecorator(CmsEntryFormPresenterReviewDecorator);
        container.registerDecorator(CmsReviewTableRowMapperDecorator);
        container.register(CmsReviewListEntriesFieldSelection);
        container.register(CmsReviewGetEntryFieldSelection);
    }
});
```

`packages/app-headless-cms-workflows/src/index.tsx` (Task 11 and Task 20 hunks stay; add):

```tsx
// before
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";
// after
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";
import { CmsReviewMoveEntryAction } from "~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js";
```

```tsx
// before
            <CmsEntryReviewNewRevision />
// after
            <CmsEntryReviewNewRevision />
            <CmsReviewMoveEntryAction />
```

`packages/app-headless-cms-workflows/src/index.test.tsx` (Task 11's file, plus Task 20's edit): add one stub next to the others, because the new root child is a component decorator and that test mounts no `CompositionProvider`:

```tsx
vi.mock("~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js", () => {
    return { CmsReviewMoveEntryAction: () => null };
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/CmsReviewFieldSelections.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/presentation/CmsReviewTableRowMapperDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/CmsEntriesList/CmsReviewMoveEntryAction.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/cache/CmsReviewCacheWriterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -50
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts 2>&1 | tail -50
git ls-files 'packages/app-headless-cms-workflows/**/*.test.ts*'
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
```

Run each other Task 11 and Task 20 test file the listing shows by path too. Expected: all PASS, no type errors. Task 20's `index.editor.test.tsx` mounts the same root and now also gets the list and cache pieces; it must stay green.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full, building the changed package with `--no-cache`, and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-headless-cms-workflows): follow the review state in the CMS entry list and cache" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

## Contract notes

1. **Extra files and edits.** Besides the contract's files: `CmsReviewCacheSyncHandlerImpl.ts` (the subclass registration, R237), `CmsReviewCacheWriter.ts` + `CmsReviewCacheWriterImpl.ts` (token and implementation in separate files, as Task 11 does), and the Move gate `Components/CmsEntriesList/CmsReviewMoveEntryAction.tsx` with its `index.tsx` mounting. Task 11's `index.test.tsx` gets one more stub.
2. **Move scope (R250, QBZ-36).** Gated: the per-row "Move" action of the list (`Browser.Entry.Action` name `move`), while `reviewState` is in progress. Not gated in 8a: moving by drag and drop in the list, the bulk "Move" (rows that are not approved are already unselectable through the row mapper) and `MoveEntryUseCase` / the move mutation (server enforcement was not verified). A disabled Radix menu item cannot take focus, so the reason is given on hover and through a hidden `aria-describedby` element; verify in the browser that wrapping `OptionsMenuItem` in the tooltip's `span` keeps the item's menu behaviour (if it breaks keyboard roving, render the blocked item without the tooltip and keep the hidden description).
3. **Old types stay.** `ICmsEntryWorkflowState` and `ICmsEntrySystemWithWorkflow` stay in `types.ts` while the not-yet-deleted old files import them; Task 37 deletes those files and the two types. New: `ICmsEntrySystemWithReview`, `ICmsEntryMetaWithReview`.
4. **Verify (Tasks 8, 10 and 13 are not all built):** `isReviewSelectable(null)` is `true`; `ReviewCacheSyncHandler` is a public class with constructor `(writer)` implementing `ReviewChangedHandler.Interface`; `container.resolveAll` of an unregistered abstraction returns `[]` (read in `@webiny/di`'s `resolveMultiple`); `EntryAction`'s `createDecorator` props are `name` and `element` (`Record.Action` props); the `@webiny/app-aco` mock in the Move and root tests replaces only `AcoConfig.Record.Action`; `ContentEntriesCacheProvider` API as read in `packages/app-headless-cms/src/features/contentEntry/ContentEntriesCacheProvider.ts` and `packages/app-admin/src/features/listCache/ListCache.ts`.
5. **Size.** Small to medium (seven tiny source files, five test files); no split needed.
