### Task 24: WB page list glue (field selections, row mapper, `changeStatus`, `usePage`, cache writer)

Spec 13.1, 13.4; R202 (shared core, thin glue), R211 (decorators registered only under the gated root), R213 (`ReviewChangedEvent` and the app cache writer), R237, R243, D60, D70, D112; Q10, Q19; Review Focus 1, 8, 17, 21. The page list needs the review state of each row (to lock the row and hide Change status) and must follow review changes without a reload. Everything review-specific is shared; this task holds the Website Builder selection of `system.workflow`, the row decoration, the Change status gate and the one per-app piece, the cache writer.

- **Selections:** one constant `WB_REVIEW_PAGE_SELECTION` (`system { workflow { <REVIEW_SYSTEM_WORKFLOW_SELECTION> } }`, `REVIEW_SYSTEM_WORKFLOW_SELECTION = "workflowId reviewState stepId stepName stepState"`) is used by the list selection `WbReviewListPagesFieldSelection` and the single-page selection `WbReviewGetPageFieldSelection`. The API type is `WbPageSystemWorkflow { workflowId reviewState stepId stepName stepState }` (`packages/api-website-builder-workflows/src/WebsiteBuilderPageSchemaFactory.ts`); the old selection asked for a field `state` that no longer exists.
- **Row mapper (D70, D112):** `WbReviewTableRowMapperDecorator` decorates `TableRowMapper`: a row is selectable only when `isReviewSelectable(page.system?.workflow?.reviewState ?? null)` (approved, or no review), otherwise `$selectable: false` (no bulk actions on pages in review, rejected or cancelled).
- **Change status:** `PageListChangeStatus` (`Browser.Page.Action.createDecorator`, name `changeStatus`, replaced in place) renders the base action only when the row is review-selectable (approved or no review), so a published page with an approved review can still be unpublished and a page in review or rejected cannot be published or unpublished from the list. An unpublished page with an approved review or no review keeps the action, so it can be published again from the list (Q19); a page that was published before the workflow was bound has no review, and the server refuses its publish with `Workflows/Review/PublishBlocked` (A89), which the admin error toast shows.
- **`usePage`** keeps its code (it already maps `page.system?.workflow ?? null` to `page.workflow`); its type becomes `SystemWorkflowValue | null` through `types.ts`, and a test pins the mapping.
- **Cache writer (R213):** `WbReviewPageCacheWriter` (`IReviewCacheWriter`): `canHandle(namespace)` is `namespace === WB_PAGE_APP`; `write(ref, workflow)` replaces `system.workflow` on the page whose **revision id** equals `ref.targetRevisionId` in the page list cache (`PageListCache`, keyed by `entryId`, holds the latest revision per page) and in the full page cache (`FullPageCache`, keyed by `id`), leaving every other page untouched; `null` clears it (cancelled review). A review of an older revision therefore never marks the latest revision's row. The writer is the only Website Builder knowledge in the sync: the shared `ReviewCacheSyncHandler` (Task 10) calls it.
- **Subclass rule (R237, never `createImplementation` on a shared class):** the shared `ReviewCacheSyncHandler` is subclassed once for this app in the file `WbReviewCacheSyncHandlerImpl.ts` (named after its class, exported as `WbReviewCacheSyncHandler`), with an unexported `WbReviewCacheSyncHandlerImpl extends ReviewCacheSyncHandler implements ReviewChangedHandler.Interface`, and `WbReviewCacheSyncHandler = ReviewChangedHandler.createImplementation({ implementation: WbReviewCacheSyncHandlerImpl, dependencies: [WbReviewPageCacheWriter] })`. The CMS binding (Task 21) is a separate subclass, so the two never collide.
- **Registration:** `PageListWorkflowsFeature` and `PageGetWorkflowsFeature` (existing, gated by the root) now register the new selections and the row mapper decorator; `WbReviewCacheFeature` (new) registers the writer (singleton) and the handler, and `WebsiteBuilderWorkflows` registers it inside the flag gate.
- **Replaced and removed:** the old `WorkflowStateListPagesFieldSelection.ts` and `WorkflowStatesGetPageGraphQLFieldSelection.ts` stop being registered (deleted in Task 37). The old `TableRowMapperDecorator.ts` reads `workflow.state`, which the new `types.ts` removes, so it would stop compiling: it is deleted here with `git rm` (see Contract notes).

**Files:**
- Create: `packages/app-website-builder-workflows/src/presentation/page/wbReviewPageSelection.ts`
- Create: `packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewListPagesFieldSelection.ts`
- Create: `packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewTableRowMapperDecorator.ts`
- Create: `packages/app-website-builder-workflows/src/presentation/page/PageGet/WbReviewGetPageFieldSelection.ts`
- Create: `packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriter.ts` (token, one abstraction per file)
- Create: `packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriterImpl.ts` (class `WbReviewPageCacheWriterImpl`, exported as `WbReviewPageCacheWriter`)
- Create: `packages/app-website-builder-workflows/src/features/cache/WbReviewCacheSyncHandlerImpl.ts` (class `WbReviewCacheSyncHandlerImpl`, exported as `WbReviewCacheSyncHandler`)
- Create: `packages/app-website-builder-workflows/src/features/cache/feature.ts`
- Rewrite: `packages/app-website-builder-workflows/src/types.ts`, `src/presentation/page/PageList/feature.ts`, `src/presentation/page/PageGet/feature.ts`, `src/Components/PagesList/PageListChangeStatus.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.tsx`
- Delete: `packages/app-website-builder-workflows/src/presentation/page/PageList/TableRowMapperDecorator.ts`
- Unchanged code: `src/hooks/usePage.ts`
- Create tests (under `packages/app-website-builder-workflows/`): `src/presentation/page/PageList/WbReviewListPagesFieldSelection.test.ts`, `src/presentation/page/PageGet/WbReviewGetPageFieldSelection.test.ts`, `src/presentation/page/PageList/WbReviewTableRowMapperDecorator.test.ts`, `src/features/cache/WbReviewPageCacheWriterImpl.test.ts`, `src/Components/PagesList/PageListChangeStatus.test.tsx`, `src/hooks/usePage.test.tsx`, `src/pageListGlue.wiring.test.tsx`

**Interfaces:**
- Consumes: Task 8 (deep paths under `@webiny/app-workflows/review/`): `gateway/reviewFields.js` (`REVIEW_SYSTEM_WORKFLOW_SELECTION`), `domain/isReviewSelectable.js`, `domain/toSystemWorkflow.js`, `domain/types.js` (`SystemWorkflowValue`), `domain/ReviewState.js`, `domain/StepState.js`, `cache/IReviewCacheWriter.js` (`IReviewCacheWriter`, `ReviewCacheRef`), `testing/reviewFixtures.js` (`createReview`; the pure fixture builders are owned by Task 8 and extended by Task 13, R243, so this task depends on Tasks 8 and 13 being merged; the overrides used here, `namespace`, `targetId`, `targetRevisionId` and `state`, are fields of Task 8's `Review`); Task 10: `cache/ReviewCacheSyncHandler.js` (public class, constructor `(writer: IReviewCacheWriter)`), `events/ReviewChangedEvent.js` (`ReviewChangedEvent`, constructor takes the payload, `BaseEvent`) and `events/ReviewChangedHandler.js` (`ReviewChangedHandler`, R245); Task 12 `WB_PAGE_APP` (`~/constants.js`, `"wb.page"`); Task 22 (`WbPageReviewFeature` registration line in `index.tsx`). Existing Website Builder code (deep imports): `ListPagesGraphQLFieldSelection` (`.../features/pages/listPages/abstractions.js`), `GetPageGraphQLFieldSelection` (`.../features/pages/getPage/abstractions.js`), `TableRowMapper` abstraction (`.../presentation/pages/PageList/components/Table/abstractions.js`) and its base implementation (`.../Table/TableRowMapper.js`), `PageListCache` and `FullPageCache` (`.../features/pages/shared/abstractions.js`, both `IListCache<Page>`: `updateItems(updater)`, `getItems()`, `addItems`), `Page` and `PageDtoMapper` (`.../domain/Page/index.js`), `PageProvider` (`.../presentation/pages/PageList/hooks/usePage.js`), `PageListConfig` with `Browser.Page.Action` (`.../presentation/pages/PageList/configs/index.js`), `ListCache` (`@webiny/app-admin/features/listCache/index.js`).
- Produces: `WbReviewPageCacheWriter` token (`features/cache/WbReviewPageCacheWriter.ts`, one abstraction in the file) and implementation (`WbReviewPageCacheWriterImpl.ts`, exported under the token name), `WbReviewCacheSyncHandler`, `WbReviewCacheFeature`, the three selection and mapper classes, the `changeStatus` gate. Consumed by Task 37 (deletes the old files) and by nothing else.

**Test runner note:** admin package: `yarn test <path>` only (no `test:os`, not an `-es`/`-os` package). `PageAction` is mocked in the one component test (the real one registers a config property through `@webiny/app-aco`, which needs the whole list config provider); everything else uses real classes and real `ListCache`s. Every rendering test calls `cleanup()` in `afterEach`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewListPagesFieldSelection.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/listPages/abstractions.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WbReviewListPagesFieldSelection } from "./WbReviewListPagesFieldSelection.js";

describe("WbReviewListPagesFieldSelection", () => {
    it("selects system.workflow with the shared selection constant", () => {
        const container = new Container();
        container.register(WbReviewListPagesFieldSelection);

        const selections = container.resolveAll(ListPagesGraphQLFieldSelection);

        expect(selections).toHaveLength(1);
        const fields = selections[0].getSelection();
        expect(fields).toHaveLength(1);
        const normalized = fields[0].replace(/\s+/g, " ").trim();
        expect(normalized).toBe(`system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } }`);
    });

    it("asks for reviewState, not the old state field", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
    });
});
```

Create `packages/app-website-builder-workflows/src/presentation/page/PageGet/WbReviewGetPageFieldSelection.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WbReviewGetPageFieldSelection } from "./WbReviewGetPageFieldSelection.js";

describe("WbReviewGetPageFieldSelection", () => {
    it("selects system.workflow with the shared selection constant", () => {
        const container = new Container();
        container.register(WbReviewGetPageFieldSelection);

        const selections = container.resolveAll(GetPageGraphQLFieldSelection);

        expect(selections).toHaveLength(1);
        const fields = selections[0].getSelection();
        expect(fields).toHaveLength(1);
        const normalized = fields[0].replace(/\s+/g, " ").trim();
        expect(normalized).toBe(`system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } }`);
    });
});
```

Create `packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewTableRowMapperDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { TableRowMapper as TableRowMapperAbstraction } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/abstractions.js";
import { TableRowMapper as BaseTableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/TableRowMapper.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import "~/types.js";
import { WbReviewTableRowMapperDecorator } from "./WbReviewTableRowMapperDecorator.js";

const createMapper = (): TableRowMapperAbstraction.Interface => {
    const container = new Container();
    container.register(BaseTableRowMapper);
    container.registerDecorator(WbReviewTableRowMapperDecorator);
    return container.resolve(TableRowMapperAbstraction);
};

const createPage = (reviewState: ReviewStateValue | null): Page => {
    const system =
        reviewState === null
            ? null
            : {
                  workflow: {
                      workflowId: "workflow-1",
                      reviewState,
                      stepId: "step-1",
                      stepName: "Legal",
                      stepState: StepState.InReview
                  }
              };

    return Page.create({
        id: "page-1#0001",
        entryId: "page-1",
        status: WbPageStatus.Draft,
        system
    });
};

interface SelectableCase {
    reviewState: ReviewStateValue | null;
    selectable: boolean;
}

const CASES: SelectableCase[] = [
    { reviewState: null, selectable: true },
    { reviewState: ReviewState.Approved, selectable: true },
    { reviewState: ReviewState.InProgress, selectable: false },
    { reviewState: ReviewState.Rejected, selectable: false },
    { reviewState: ReviewState.Cancelled, selectable: false }
];

describe("WbReviewTableRowMapperDecorator", () => {
    it.each(CASES)("review state $reviewState: selectable is $selectable", ({
        reviewState,
        selectable
    }) => {
        const mapper = createMapper();

        const row = mapper.fromPage(createPage(reviewState));

        expect(row.$selectable).toBe(selectable);
    });

    it("keeps everything else of the base row", () => {
        const mapper = createMapper();

        const row = mapper.fromPage(createPage(ReviewState.InProgress));

        expect(row.id).toBe("page-1");
        expect(row.$type).toBe("RECORD");
    });
});
```

Create `packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriterImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import "~/types.js";
import { WbReviewPageCacheWriter as WriterAbstraction } from "./WbReviewPageCacheWriter.js";
import { WbReviewPageCacheWriter } from "./WbReviewPageCacheWriterImpl.js";

const WORKFLOW: SystemWorkflowValue = {
    workflowId: "workflow-1",
    reviewState: ReviewState.InProgress,
    stepId: "step-1",
    stepName: "Legal",
    stepState: StepState.InReview
};

const createPage = (id: string, entryId: string, title: string): Page => {
    return Page.create({
        id,
        entryId,
        status: WbPageStatus.Draft,
        properties: { title }
    });
};

describe("WbReviewPageCacheWriterImpl", () => {
    let listCache: ListCache<Page>;
    let fullCache: ListCache<Page>;
    let writer: WriterAbstraction.Interface;

    beforeEach(() => {
        listCache = new ListCache<Page>("entryId");
        fullCache = new ListCache<Page>("id");
        listCache.addItems([
            createPage("page-1#0002", "page-1", "Home"),
            createPage("page-2#0001", "page-2", "About")
        ]);
        fullCache.addItems([
            createPage("page-1#0002", "page-1", "Home"),
            createPage("page-1#0001", "page-1", "Home old")
        ]);

        const container = new Container();
        container.registerInstance(PageListCache, listCache);
        container.registerInstance(FullPageCache, fullCache);
        container.register(WbReviewPageCacheWriter);
        writer = container.resolve(WriterAbstraction);
    });

    it("handles only the Website Builder page namespace", () => {
        expect(writer.canHandle("wb.page")).toBe(true);
        expect(writer.canHandle("cms.article")).toBe(false);
    });

    it("puts the workflow on the matching revision in both caches and nothing else", () => {
        writer.write(
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0002" },
            WORKFLOW
        );

        const listItems = listCache.getItems();
        const home = listItems.find(page => page.entryId === "page-1");
        const about = listItems.find(page => page.entryId === "page-2");
        expect(home?.system?.workflow).toEqual(WORKFLOW);
        expect(about?.system).toBeNull();

        const fullItems = fullCache.getItems();
        const latest = fullItems.find(page => page.id === "page-1#0002");
        const older = fullItems.find(page => page.id === "page-1#0001");
        expect(latest?.system?.workflow).toEqual(WORKFLOW);
        expect(older?.system).toBeNull();
    });

    it("a review of an older revision does not mark the latest row", () => {
        writer.write(
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0001" },
            WORKFLOW
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system).toBeNull();
        const older = fullCache.getItems().find(page => page.id === "page-1#0001");
        expect(older?.system?.workflow).toEqual(WORKFLOW);
    });

    it("clears the workflow with null", () => {
        const ref = { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0002" };
        writer.write(ref, WORKFLOW);

        writer.write(ref, null);

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system?.workflow).toBeNull();
    });

    it("keeps the other fields of the page and is a no-op for a page that is not cached", () => {
        writer.write(
            { namespace: "wb.page", targetId: "page-9", targetRevisionId: "page-9#0001" },
            WORKFLOW
        );
        expect(listCache.count()).toBe(2);

        writer.write(
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0002" },
            WORKFLOW
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.properties.title).toBe("Home");
        expect(home?.id).toBe("page-1#0002");
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PagesList/PageListChangeStatus.test.tsx`:

```tsx
import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CompositionProvider } from "@webiny/react-composition";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import "~/types.js";
import { PageListChangeStatus } from "./PageListChangeStatus.js";

vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageList/configs/Browser/PageAction.js",
    async () => {
        const React = await import("react");
        const { makeDecoratable } = await import("@webiny/react-composition");
        interface StubProps {
            name: string;
            element?: React.ReactElement;
        }
        const PageAction = makeDecoratable("PageAction", (props: StubProps) => {
            return props.element ?? null;
        });
        return { PageAction };
    }
);

const { Browser } = PageListConfig;

const createDto = (reviewState: ReviewStateValue | null) => {
    const system =
        reviewState === null
            ? null
            : {
                  workflow: {
                      workflowId: "workflow-1",
                      reviewState,
                      stepId: "step-1",
                      stepName: "Legal",
                      stepState: StepState.InReview
                  }
              };
    const page = Page.create({ id: "page-1#0001", entryId: "page-1", system });
    return PageDtoMapper.toDTO(page);
};

const mountActions = (reviewState: ReviewStateValue | null) => {
    render(
        <CompositionProvider>
            <PageProvider page={createDto(reviewState)}>
                <PageListChangeStatus />
                <Browser.Page.Action
                    name={"changeStatus"}
                    element={<span data-testid={"change-status"} />}
                />
                <Browser.Page.Action name={"edit"} element={<span data-testid={"edit"} />} />
            </PageProvider>
        </CompositionProvider>
    );
};

interface GateCase {
    reviewState: ReviewStateValue | null;
    visible: boolean;
}

const CASES: GateCase[] = [
    { reviewState: null, visible: true },
    { reviewState: ReviewState.Approved, visible: true },
    { reviewState: ReviewState.InProgress, visible: false },
    { reviewState: ReviewState.Rejected, visible: false },
    { reviewState: ReviewState.Cancelled, visible: false }
];

describe("PageListChangeStatus", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)("review state $reviewState: Change status visible is $visible", ({
        reviewState,
        visible
    }) => {
        mountActions(reviewState);

        expect(screen.queryAllByTestId("change-status")).toHaveLength(visible ? 1 : 0);
    });

    it("leaves every other row action alone", () => {
        mountActions(ReviewState.InProgress);

        expect(screen.queryAllByTestId("edit")).toHaveLength(1);
    });
});
```

Create `packages/app-website-builder-workflows/src/hooks/usePage.test.tsx`:

```tsx
import React from "react";
import { renderHook } from "@testing-library/react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import "~/types.js";
import { usePage } from "./usePage.js";

const WORKFLOW: SystemWorkflowValue = {
    workflowId: "workflow-1",
    reviewState: ReviewState.Approved,
    stepId: "step-2",
    stepName: "Legal",
    stepState: StepState.Approved
};

const createWrapper = (system: Page["system"]) => {
    const page = Page.create({ id: "page-1#0001", entryId: "page-1", system });
    const dto = PageDtoMapper.toDTO(page);

    return function PageWrapper({ children }: { children: React.ReactNode }) {
        return <PageProvider page={dto}>{children}</PageProvider>;
    };
};

describe("usePage", () => {
    it("exposes system.workflow as page.workflow", () => {
        const wrapper = createWrapper({ workflow: WORKFLOW });

        const { result } = renderHook(() => usePage(), { wrapper });

        expect(result.current.page.workflow).toEqual(WORKFLOW);
    });

    it("is null when the page has no workflow", () => {
        const wrapper = createWrapper(null);

        const { result } = renderHook(() => usePage(), { wrapper });

        expect(result.current.page.workflow).toBeNull();
    });
});
```

Create `packages/app-website-builder-workflows/src/pageListGlue.wiring.test.tsx` (composition root, flag on and off, R211; the cache sync end to end through the shared handler):

```tsx
import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { createAbstraction } from "@webiny/feature/admin";
import { CompositionProvider } from "@webiny/react-composition";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/listPages/abstractions.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { TableRowMapper as TableRowMapperAbstraction } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/abstractions.js";
import { TableRowMapper as BaseTableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/TableRowMapper.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { toSystemWorkflow } from "@webiny/app-workflows/review/domain/toSystemWorkflow.js";
import type { IReviewCacheWriter } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";
import { ReviewCacheSyncHandler } from "@webiny/app-workflows/review/cache/ReviewCacheSyncHandler.js";
import { ReviewChangedEvent } from "@webiny/app-workflows/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { createReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import "~/types.js";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: () => flags.enabled }) };
});

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/PagesList/index.js", () => {
    return { PagesList: () => null };
});

vi.mock("~/Components/OptionItem/index.js", () => {
    return { ListOpenInNewWindow: () => null };
});

const createPage = (id: string, entryId: string): Page => {
    return Page.create({ id, entryId, status: WbPageStatus.Draft });
};

/**
 * Stands in for another app's cache sync: its own subclass of the shared handler (R237), bound to
 * its own writer token.
 */
const OtherAppWriter = createAbstraction<IReviewCacheWriter>("Test/OtherAppReviewCacheWriter");

class OtherAppCacheSyncHandlerImpl
    extends ReviewCacheSyncHandler
    implements ReviewChangedHandler.Interface {}

const OtherAppCacheSyncHandler = ReviewChangedHandler.createImplementation({
    implementation: OtherAppCacheSyncHandlerImpl,
    dependencies: [OtherAppWriter]
});

const mountRoot = (enabled: boolean) => {
    flags.enabled = enabled;
    const listCache = new ListCache<Page>("entryId");
    const fullCache = new ListCache<Page>("id");
    listCache.addItems([createPage("page-1#0001", "page-1"), createPage("page-2#0001", "page-2")]);
    fullCache.addItems([createPage("page-1#0001", "page-1")]);

    const container = new Container();
    container.register(BaseTableRowMapper);
    container.registerInstance(PageListCache, listCache);
    container.registerInstance(FullPageCache, fullCache);

    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <WebsiteBuilderWorkflows />
            </CompositionProvider>
        </DiContainerProvider>
    );

    return { container, listCache, fullCache };
};

const createInProgressPage = (): Page => {
    return Page.create({
        id: "page-1#0001",
        entryId: "page-1",
        status: WbPageStatus.Draft,
        system: {
            workflow: {
                workflowId: "workflow-1",
                reviewState: ReviewState.InProgress,
                stepId: "step-1",
                stepName: "Legal",
                stepState: StepState.InReview
            }
        }
    });
};

describe("Website Builder page list glue from the composition root", () => {
    afterEach(() => {
        cleanup();
    });

    it("flag on: both field selections ask for system.workflow", () => {
        const { container } = mountRoot(true);

        const listSelections = container.resolveAll(ListPagesGraphQLFieldSelection);
        const getSelections = container.resolveAll(GetPageGraphQLFieldSelection);

        expect(listSelections).toHaveLength(1);
        expect(getSelections).toHaveLength(1);
        expect(listSelections[0].getSelection()[0]).toContain("reviewState");
        expect(getSelections[0].getSelection()[0]).toContain("reviewState");
    });

    it("flag on: rows of pages in review are not selectable", () => {
        const { container } = mountRoot(true);
        const mapper = container.resolve(TableRowMapperAbstraction);

        const row = mapper.fromPage(createInProgressPage());

        expect(row.$selectable).toBe(false);
    });

    it("flag on: a review change updates the page row through the shared handler and the writer", async () => {
        const { container, listCache, fullCache } = mountRoot(true);
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(1);
        const review = createReview({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            state: ReviewState.InProgress
        });
        const expected = toSystemWorkflow(review);
        expect(expected).not.toBeNull();

        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                review
            })
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        const other = listCache.getItems().find(page => page.entryId === "page-2");
        const full = fullCache.getItems().find(page => page.id === "page-1#0001");
        expect(home?.system?.workflow).toEqual(expected);
        expect(full?.system?.workflow).toEqual(expected);
        expect(other?.system).toBeNull();

        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                review: null
            })
        );

        const cleared = listCache.getItems().find(page => page.entryId === "page-1");
        expect(cleared?.system?.workflow).toBeNull();
    });

    it("flag on: another app's subclass of the shared handler coexists with this app's (R237)", async () => {
        const { container, listCache } = mountRoot(true);
        const otherWrite = vi.fn();
        const otherWriter: IReviewCacheWriter = {
            canHandle: namespace => namespace === "cms.article",
            write: otherWrite
        };
        container.registerInstance(OtherAppWriter, otherWriter);
        container.register(OtherAppCacheSyncHandler);
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(2);
        const pageReview = createReview({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            state: ReviewState.InProgress
        });
        const entryReview = createReview({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            state: ReviewState.InProgress
        });

        for (const handler of handlers) {
            await handler.handle(
                new ReviewChangedEvent({
                    namespace: "wb.page",
                    targetId: "page-1",
                    targetRevisionId: "page-1#0001",
                    review: pageReview
                })
            );
        }
        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system?.workflow).toEqual(toSystemWorkflow(pageReview));
        expect(otherWrite).not.toHaveBeenCalled();

        for (const handler of handlers) {
            await handler.handle(
                new ReviewChangedEvent({
                    namespace: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    review: entryReview
                })
            );
        }
        expect(otherWrite).toHaveBeenCalledTimes(1);
        const stillHome = listCache.getItems().find(page => page.entryId === "page-1");
        expect(stillHome?.system?.workflow).toEqual(toSystemWorkflow(pageReview));
    });

    it("flag on: a review of another namespace is ignored", async () => {
        const { container, listCache } = mountRoot(true);
        const handlers = container.resolveAll(ReviewChangedHandler);
        const review = createReview({
            namespace: "cms.article",
            targetId: "page-1",
            targetRevisionId: "page-1#0001"
        });

        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "cms.article",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                review
            })
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system).toBeNull();
    });

    it("flag off: nothing is registered and rows stay selectable", () => {
        const { container } = mountRoot(false);

        expect(container.resolveAll(ListPagesGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(GetPageGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(ReviewChangedHandler)).toHaveLength(0);
        const mapper = container.resolve(TableRowMapperAbstraction);
        const row = mapper.fromPage(createInProgressPage());
        expect(row.$selectable).toBe(true);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewListPagesFieldSelection.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/presentation/page/PageGet/WbReviewGetPageFieldSelection.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewTableRowMapperDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PagesList/PageListChangeStatus.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/hooks/usePage.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/pageListGlue.wiring.test.tsx 2>&1 | tail -50
```

Expected: the first four FAIL to load (`Failed to resolve import "./WbReviewListPagesFieldSelection.js"`, `"./WbReviewGetPageFieldSelection.js"`, `"./WbReviewTableRowMapperDecorator.js"`, `"./WbReviewPageCacheWriter.js"`). `PageListChangeStatus.test.tsx` loads and FAILS on behaviour: the old gate reads `page.workflow?.state` (always undefined now) and shows Change status for the `inProgress`, `rejected` and `cancelled` cases. `usePage.test.tsx` PASSES already (the hook's code does not change; the test only pins it, and only its type check fails until `types.ts` changes). `pageListGlue.wiring.test.tsx` FAILS: with the flag on, `resolveAll(ListPagesGraphQLFieldSelection)[0].getSelection()[0]` still contains `state` and not `reviewState`, and `resolveAll(ReviewChangedHandler)` is empty. Record this RED.

- [ ] **Step 3: Implement**

Create `packages/app-website-builder-workflows/src/presentation/page/wbReviewPageSelection.ts`:

```ts
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const WB_REVIEW_PAGE_SELECTION = `system {
    workflow {
        ${REVIEW_SYSTEM_WORKFLOW_SELECTION}
    }
}`;
```

Create `packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewListPagesFieldSelection.ts`:

```ts
import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/listPages/abstractions.js";
import { WB_REVIEW_PAGE_SELECTION } from "../wbReviewPageSelection.js";

class WbReviewListPagesFieldSelectionImpl implements ListPagesGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [WB_REVIEW_PAGE_SELECTION];
    }
}

export const WbReviewListPagesFieldSelection = ListPagesGraphQLFieldSelection.createImplementation({
    dependencies: [],
    implementation: WbReviewListPagesFieldSelectionImpl
});
```

Create `packages/app-website-builder-workflows/src/presentation/page/PageGet/WbReviewGetPageFieldSelection.ts`:

```ts
import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { WB_REVIEW_PAGE_SELECTION } from "../wbReviewPageSelection.js";

class WbReviewGetPageFieldSelectionImpl implements GetPageGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [WB_REVIEW_PAGE_SELECTION];
    }
}

export const WbReviewGetPageFieldSelection = GetPageGraphQLFieldSelection.createImplementation({
    dependencies: [],
    implementation: WbReviewGetPageFieldSelectionImpl
});
```

Create `packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewTableRowMapperDecorator.ts`:

```ts
import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { TableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/abstractions.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import "~/types.js";

class WbReviewTableRowMapperDecoratorImpl implements TableRowMapper.Interface {
    constructor(private decoratee: TableRowMapper.Interface) {}

    fromPage(page: Page): TableRowMapper.TableRow {
        const row = this.decoratee.fromPage(page);

        const reviewState = page.system?.workflow?.reviewState ?? null;
        if (isReviewSelectable(reviewState)) {
            return row;
        }

        return { ...row, $selectable: false };
    }
}

export const WbReviewTableRowMapperDecorator = TableRowMapper.createDecorator({
    decorator: WbReviewTableRowMapperDecoratorImpl,
    dependencies: []
});
```

Create `packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriter.ts` (the token; one abstraction per file, no `abstractions.ts`):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewCacheWriter } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";

export const WbReviewPageCacheWriter = createAbstraction<IReviewCacheWriter>(
    "Wb/Workflows/ReviewCacheWriter"
);

export namespace WbReviewPageCacheWriter {
    export type Interface = IReviewCacheWriter;
}
```

Create `packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriterImpl.ts` (named after its class, exported under the token name, as Task 21's `CmsReviewCacheWriterImpl.ts`):

```ts
import type { ReviewCacheRef } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import type { WbPageSystem } from "@webiny/app-website-builder/types.js";
import { WB_PAGE_APP } from "~/constants.js";
import "~/types.js";
import { WbReviewPageCacheWriter as Abstraction } from "./WbReviewPageCacheWriter.js";

class WbReviewPageCacheWriterImpl implements Abstraction.Interface {
    constructor(
        private pageListCache: PageListCache.Interface,
        private fullPageCache: FullPageCache.Interface
    ) {}

    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    write(ref: ReviewCacheRef, workflow: SystemWorkflowValue | null): void {
        const updatePage = (page: Page): Page => {
            if (page.id !== ref.targetRevisionId) {
                return page;
            }

            const system: WbPageSystem = { ...page.system, workflow };
            return Page.create({ ...page, system });
        };

        this.pageListCache.updateItems(updatePage);
        this.fullPageCache.updateItems(updatePage);
    }
}

export const WbReviewPageCacheWriter = Abstraction.createImplementation({
    implementation: WbReviewPageCacheWriterImpl,
    dependencies: [PageListCache, FullPageCache]
});
```

Create `packages/app-website-builder-workflows/src/features/cache/WbReviewCacheSyncHandlerImpl.ts` (the Website Builder subclass of the shared handler; the shared class is never passed to `createImplementation`, and the subclass is not exported):

```ts
import { ReviewCacheSyncHandler } from "@webiny/app-workflows/review/cache/ReviewCacheSyncHandler.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { WbReviewPageCacheWriter } from "./WbReviewPageCacheWriter.js";

class WbReviewCacheSyncHandlerImpl
    extends ReviewCacheSyncHandler
    implements ReviewChangedHandler.Interface {}

export const WbReviewCacheSyncHandler = ReviewChangedHandler.createImplementation({
    implementation: WbReviewCacheSyncHandlerImpl,
    dependencies: [WbReviewPageCacheWriter]
});
```

Create `packages/app-website-builder-workflows/src/features/cache/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewCacheSyncHandler } from "./WbReviewCacheSyncHandlerImpl.js";
import { WbReviewPageCacheWriter } from "./WbReviewPageCacheWriterImpl.js";

export const WbReviewCacheFeature = createFeature({
    name: "WebsiteBuilder/Workflows/ReviewCache",
    register(container) {
        container.register(WbReviewPageCacheWriter).inSingletonScope();
        container.register(WbReviewCacheSyncHandler);
    }
});
```

Rewrite `packages/app-website-builder-workflows/src/types.ts` (the whole file):

```ts
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";

export type WithWorkflows<T> = T & {
    workflow: SystemWorkflowValue | null;
};

declare module "@webiny/app-website-builder/types.js" {
    export interface WbPageSystem {
        workflow: SystemWorkflowValue | null;
    }
}
```

Rewrite `packages/app-website-builder-workflows/src/presentation/page/PageList/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewListPagesFieldSelection } from "./WbReviewListPagesFieldSelection.js";
import { WbReviewTableRowMapperDecorator } from "./WbReviewTableRowMapperDecorator.js";

export const PageListWorkflowsFeature = createFeature({
    name: "PageListWorkflows",
    register(container) {
        container.register(WbReviewListPagesFieldSelection);
        container.registerDecorator(WbReviewTableRowMapperDecorator);
    }
});
```

Rewrite `packages/app-website-builder-workflows/src/presentation/page/PageGet/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewGetPageFieldSelection } from "./WbReviewGetPageFieldSelection.js";

export const PageGetWorkflowsFeature = createFeature({
    name: "PageGetWorkflows",
    register(container) {
        container.register(WbReviewGetPageFieldSelection);
    }
});
```

Rewrite `packages/app-website-builder-workflows/src/Components/PagesList/PageListChangeStatus.tsx`:

```tsx
import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import { usePage } from "~/hooks/usePage.js";

const { Browser } = PageListConfig;

interface IWrappedElementProps {
    element: React.ReactElement | undefined;
}

const WrappedElement = (props: IWrappedElementProps) => {
    const { page } = usePage();
    const reviewState = page.workflow?.reviewState ?? null;

    if (isReviewSelectable(reviewState)) {
        return props.element ?? null;
    }

    return null;
};

export const PageListChangeStatus = Browser.Page.Action.createDecorator(Original => {
    return function PageListChangeStatusAction(props) {
        if (props.name === "changeStatus") {
            return <Original {...props} element={<WrappedElement element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
```

Delete the superseded mapper (it reads `workflow.state`):

```bash
git rm packages/app-website-builder-workflows/src/presentation/page/PageList/TableRowMapperDecorator.ts
```

Modify `packages/app-website-builder-workflows/src/index.tsx`. This hunk applies on top of Task 22's: the `WbPageReviewFeature` lines below are Task 22's and are shown only as anchors, do not add them again. Add the import after Task 22's import:

```tsx
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import { WbReviewCacheFeature } from "~/features/cache/feature.js";
```

(the second line is the only new one) and the registration after Task 22's registration:

```tsx
            <RegisterFeature feature={WbPageReviewFeature} />
            <RegisterFeature feature={WbReviewCacheFeature} />
```

(the second line is the only new one). `src/hooks/usePage.ts` keeps its code unchanged (it types through `~/types.js`).

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewListPagesFieldSelection.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/presentation/page/PageGet/WbReviewGetPageFieldSelection.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/presentation/page/PageList/WbReviewTableRowMapperDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/cache/WbReviewPageCacheWriterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PagesList/PageListChangeStatus.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/hooks/usePage.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/pageListGlue.wiring.test.tsx 2>&1 | tail -50
```

Expected: all PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

The root and the shared registration changed, so Tasks 12, 22 and 23 re-run, one command per file:

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.test.tsx 2>&1 | tail -50
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

(run every file the `ls` prints). The package has no `__tests__/**/*.test.ts` file, so `check:test:types` does not list it and the package build is the type check of its co-located tests (R243). Expected: all pass and the build prints no type errors. A type error in the old files (`PagesListContentReviews.tsx`, `OptionItem`, `PageWorkflows`) that reads the removed `IPageWorkflowState` would mean they still use it: they do not today (`grep -rn "IPageWorkflowState\|WithWorkflows" packages/app-website-builder-workflows/src` must list only `types.ts`, `hooks/usePage.ts`).

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (it stages everything with `git add .`; `.gitleaks.toml`, `docs/.reports` and `.superpowers` are never committed) and restore `.gitleaks.toml` after format and after build:

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
```

If any step fails and you fix anything, rerun the chain from the start. Then:

```bash
git commit -m "feat(app-website-builder-workflows): page list follows the review state and review changes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes:**
- `{ ...page.system, workflow }` is typed as `WbPageSystem`: spreading `WbPageSystem | null` is valid and carries the other `system` keys; if the page system type ever gains required fields they come through the spread, and `workflow` is the only key this writer sets.
- Verify at implementation time: `Container.resolveAll` returns `[]` for an abstraction with no registration (flag-off assertions rely on it; if it throws, assert `toThrow` instead); the `ReviewChangedEvent` constructor takes the payload (`BaseEvent`); `createReview` accepts the overrides used; the `PageAction` module path mocked in the component test is the one `Browser/index.ts` imports.
