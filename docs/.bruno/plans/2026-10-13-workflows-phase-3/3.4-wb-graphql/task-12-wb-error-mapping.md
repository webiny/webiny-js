### Task 12: WB page resolvers and the scheduler keep the workflows error (A26, R103)

Spec 10 ("errors return `code`, `message` and `data`"), A26, R103. Two Website Builder paths lose the error code today:

- `packages/api-website-builder/src/graphql/pages/pages.gql.ts`: twelve resolvers run inside WB's `resolve()` (`src/utils/resolve.ts`: `Response` on success, `new ErrorResponse(e)` for anything thrown) and turn a failed Result into `throw new Error(result.error.message)`, so the envelope has `code: ""` and `data: null`. A rejection from a before-event handler (the workflows publish, move, trash and delete rules throw the workflows `BaseError`, A26) already reaches `resolve()` unchanged and keeps its code and data; that path stays as it is.
- `packages/api-website-builder-scheduler/src/features/PublishActionHandler/PublishPageActionHandler.ts` and `src/features/UnpublishActionHandler/UnpublishPageActionHandler.ts`: a failed Result becomes `new Error("Failed to publish page: <id>")` / `new Error("Failed to unpublish page: <id>")`; `ExecuteScheduledActionUseCase` keeps whatever the handler throws as `ExecutionFailedError.originalError`, so the original code and data are lost there. A rejection from the workflows publish rule already propagates unchanged.

The fix in `pages.gql.ts` is `throw result.error;` in place of `throw new Error(result.error.message);` at every such site. Inside `resolve()` that produces exactly `new ErrorResponse(result.error)` (R103's wording): returning an `ErrorResponse` from inside the `resolve()` callback would instead be wrapped as the `data` of a `Response`. It is the pattern `listPages` / `listDeletedPages` in the same file already use (`throw result.error` caught into `new ErrorResponse(e)`). The two sites that map a failure to their own `NotFoundError` (`getPageByPath`, `getPageById`) are not `Result.fail` pass-throughs and stay. Both scheduler handlers rethrow `result.error`.

The sites, all `throw new Error(result.error.message);` inside `resolve(async () => { ... })` (line numbers at HEAD): `WbQuery.getPageRevisions` (98), `WbMutation.createPage` (216), `updatePage` (234), `updatePageRevisionDescription` (255), `duplicatePage` (273), `translatePage` (295), `publishPage` (313), `unpublishPage` (331), `movePage` (349), `createPageRevisionFrom` (367), `deletePage` (391), `restorePage` (411).

**Tests and dependencies.** `api-website-builder` and `api-website-builder-scheduler` cannot depend on `api-website-builder-workflows` (it depends on `api-website-builder`; a dev dependency back would be a cycle, and R101 allows no new dependency). So:
- `api-website-builder` tests a non-workflows `Result.fail` through GraphQL (`WebsiteBuilder/Page/NotAuthorized`, `WebsiteBuilder/Page/NotFound` with `data: { id }`; RED before the fix) and pins the rejection path with a test-only before-publish handler that throws a `BaseError` with a code and data (green before and after).
- `api-website-builder-scheduler` tests a `Result.fail` (`WebsiteBuilder/Page/NotFound` with `data: { id }`) through `ExecuteScheduledActionUseCase` with a failing `PublishPageUseCase` decorator and, for the unpublish handler, a failing `UnpublishPageUseCase` decorator scheduled through `ScheduleUnpublishPageUseCase` (both RED before the fix).
- The real `Workflows/Review/PublishBlocked` through `publishPage` on `/graphql` is tested in `api-website-builder-workflows`, which has both packages.

Neither `api-website-builder` nor `api-website-builder-scheduler` has a `ci.config.json`, so CI runs them without a storage matrix (`.github/workflows/wac/.../TestablePackage.js`): `yarn test` only.

**Files:**
- Modify: `packages/api-website-builder/src/graphql/pages/pages.gql.ts`
- Modify: `packages/api-website-builder-scheduler/src/features/PublishActionHandler/PublishPageActionHandler.ts`
- Modify: `packages/api-website-builder-scheduler/src/features/UnpublishActionHandler/UnpublishPageActionHandler.ts`
- Modify: `packages/api-website-builder-workflows/src/features/hooks/RequireApprovedReviewOnPagePublish.ts` (doc comment)
- Create: `packages/api-website-builder/__tests__/pages.gql.errors.test.ts`
- Create: `packages/api-website-builder-scheduler/__tests__/publishPageError.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pagePublishBlocked.test.ts`

**Interfaces:**
- Consumes: `useGraphQlHandler` (`api-website-builder/__tests__/utils/useGraphQlHandler.js`: `{ wb, invoke }`, params `permissions`, `legacyPlugins`), `pageMocks` (`__tests__/mocks/page.mock.js`), `PageBeforePublishEventHandler` (`~/features/pages/PublishPage/index.js`), `BaseError` (`@webiny/feature/api`); scheduler `useHandler` (`__tests__/__mocks/context/useHandler.js`), `SchedulePublishPageUseCase`, `ScheduleUnpublishPageUseCase` (`~/exports/api/website-builder/scheduler.js`), `ExecuteScheduledActionUseCase` (`@webiny/api-scheduler/exports/api/scheduler.js`), `ExecutionFailedError` (`@webiny/api-scheduler/features/ExecuteScheduledAction/abstractions.js`, `originalError?: Error`), `PublishPageUseCase`, `UnpublishPageUseCase`, `CreatePageUseCase` (`@webiny/api-website-builder/exports/api/website-builder/page.js`), `PageNotFoundError` (`@webiny/api-website-builder/domain/page/errors.js`, code `WebsiteBuilder/Page/NotFound`, data `{ id }`); Task 11's `asGraphQLUser`, `ReviewPublishBlockedError` data `{ model, targetRevisionId, workflowId, reviewState }`.
- Produces: no new names. `pages.gql.ts` envelopes keep `code` / `data` of a failed Result; `PublishPageActionHandler.handle` and `UnpublishPageActionHandler.handle` reject with the use case's own error.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-website-builder/__tests__/pages.gql.errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { BaseError } from "@webiny/feature/api";
import { PageBeforePublishEventHandler } from "~/features/pages/PublishPage/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";

interface PublishBlockedByTestData {
    pageId: string;
}

/** Stands in for a before-publish rule such as the workflows one (A26). */
class PublishBlockedByTestError extends BaseError<PublishBlockedByTestData> {
    override readonly code = "Test/Page/PublishBlocked" as const;

    constructor(data: PublishBlockedByTestData) {
        super({ message: "Publishing is blocked by a test rule.", data });
    }
}

class BlockingBeforePublishHandler implements PageBeforePublishEventHandler.Interface {
    public async handle(event: PageBeforePublishEventHandler.Event): Promise<void> {
        throw new PublishBlockedByTestError({ pageId: event.payload.page.id });
    }
}

const blockPublish = (container: Container) => {
    container.register(
        PageBeforePublishEventHandler.createImplementation({
            implementation: BlockingBeforePublishHandler,
            dependencies: []
        })
    );
};

describe("Page resolvers keep the error code and data (R103)", () => {
    it("returns the use case's NotAuthorized code from publishPage and unpublishPage", async () => {
        const handler = useGraphQlHandler({ permissions: [] });

        const [published] = await handler.wb.publishPage({ id: "any-page#0001" });
        const [unpublished] = await handler.wb.unpublishPage({ id: "any-page#0001" });

        expect(published.data.websiteBuilder.publishPage.data).toBeNull();
        expect(published.data.websiteBuilder.publishPage.error).toMatchObject({
            code: "WebsiteBuilder/Page/NotAuthorized",
            message: "Not authorized!"
        });
        expect(unpublished.data.websiteBuilder.unpublishPage.error.code).toBe(
            "WebsiteBuilder/Page/NotAuthorized"
        );
    });

    it("returns NotFound with its data for a missing page", async () => {
        const handler = useGraphQlHandler({});

        const [published] = await handler.wb.publishPage({ id: "missing-page#0001" });

        expect(published.data.websiteBuilder.publishPage.error).toEqual({
            code: "WebsiteBuilder/Page/NotFound",
            message: "Page not found!",
            data: { id: "missing-page#0001" }
        });
    });

    it("keeps the code and data of a before-publish handler's rejection (A26)", async () => {
        const handler = useGraphQlHandler({ legacyPlugins: [blockPublish] });
        const [created] = await handler.wb.createPage({ data: pageMocks.pageA });
        const page = created.data.websiteBuilder.createPage.data;

        const [published] = await handler.wb.publishPage({ id: page.id });

        expect(published.data.websiteBuilder.publishPage.error).toEqual({
            code: "Test/Page/PublishBlocked",
            message: "Publishing is blocked by a test rule.",
            data: { pageId: page.id }
        });
    });
});
```

Create `packages/api-website-builder-scheduler/__tests__/publishPageError.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import {
    CreatePageUseCase,
    PublishPageUseCase,
    UnpublishPageUseCase
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { PageNotFoundError } from "@webiny/api-website-builder/domain/page/errors.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { ExecutionFailedError } from "@webiny/api-scheduler/features/ExecuteScheduledAction/abstractions.js";
import {
    SchedulePublishPageUseCase,
    ScheduleUnpublishPageUseCase
} from "~/exports/api/website-builder/scheduler.js";
import { useHandler } from "./__mocks/context/useHandler.js";

/** Publishing fails with WB's own error, as a blocked or missing page does. */
class FailingPublishPage implements PublishPageUseCase.Interface {
    public constructor(private decoratee: PublishPageUseCase.Interface) {}

    public async execute(params: PublishPageUseCase.Params): PublishPageUseCase.Return {
        return Result.fail(new PageNotFoundError(params.id));
    }
}

const failPublishPage = (container: Container) => {
    container.registerDecorator(
        PublishPageUseCase.createDecorator({ decorator: FailingPublishPage, dependencies: [] })
    );
};

/** Unpublishing fails with WB's own error. */
class FailingUnpublishPage implements UnpublishPageUseCase.Interface {
    public constructor(private decoratee: UnpublishPageUseCase.Interface) {}

    public async execute(params: UnpublishPageUseCase.Params): UnpublishPageUseCase.Return {
        return Result.fail(new PageNotFoundError(params.id));
    }
}

const failUnpublishPage = (container: Container) => {
    container.registerDecorator(
        UnpublishPageUseCase.createDecorator({ decorator: FailingUnpublishPage, dependencies: [] })
    );
};

describe("Scheduled page publish keeps the publish error (R103)", () => {
    it("rejects with the publish use case's own error, code and data kept", async () => {
        const context = await useHandler<ApiCoreContext>({
            legacyPlugins: [failPublishPage]
        }).handler();
        const page = (
            await context.container.resolve(CreatePageUseCase).execute({
                properties: { title: "Scheduled page" },
                metadata: {},
                bindings: {},
                elements: {},
                location: { folderId: "root" }
            })
        ).value!;
        const scheduled = await context.container.resolve(SchedulePublishPageUseCase).execute({
            id: page.id,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });
        expect(scheduled.isFail()).toBe(false);

        const result = await context.container.resolve(ExecuteScheduledActionUseCase).execute({
            id: scheduled.value!.scheduledAction.id,
            tenant: "root",
            namespace: scheduled.value!.scheduledAction.namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Execution/Failed");
        expect((result.error as ExecutionFailedError).originalError).toBeInstanceOf(
            PageNotFoundError
        );
        expect((result.error as ExecutionFailedError).originalError).toMatchObject({
            code: "WebsiteBuilder/Page/NotFound",
            data: { id: page.id }
        });
    });

    it("rejects with the unpublish use case's own error, code and data kept", async () => {
        const context = await useHandler<ApiCoreContext>({
            legacyPlugins: [failUnpublishPage]
        }).handler();
        const page = (
            await context.container.resolve(CreatePageUseCase).execute({
                properties: { title: "Scheduled page" },
                metadata: {},
                bindings: {},
                elements: {},
                location: { folderId: "root" }
            })
        ).value!;
        const scheduled = await context.container.resolve(ScheduleUnpublishPageUseCase).execute({
            id: page.id,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });
        expect(scheduled.isFail()).toBe(false);

        const result = await context.container.resolve(ExecuteScheduledActionUseCase).execute({
            id: scheduled.value!.scheduledAction.id,
            tenant: "root",
            namespace: scheduled.value!.scheduledAction.namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Execution/Failed");
        expect((result.error as ExecutionFailedError).originalError).toBeInstanceOf(
            PageNotFoundError
        );
        expect((result.error as ExecutionFailedError).originalError).toMatchObject({
            code: "WebsiteBuilder/Page/NotFound",
            data: { id: page.id }
        });
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pagePublishBlocked.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        websiteBuilder {
            publishPage(id: $id) {
                data {
                    id
                    status
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

describe("publishPage on /graphql with a pages workflow (A26, R103)", () => {
    it("returns the publish-blocked code and data from publishPage", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        const unreviewed = await createPage(admin, { title: "Page B" });
        await requestPageReview(admin, page);
        const user = asGraphQLUser();

        const inReview = await user.run(PUBLISH_PAGE, { id: page.id });
        const withoutReview = await user.run(PUBLISH_PAGE, { id: unreviewed.id });

        expect(inReview.data.websiteBuilder.publishPage.data).toBeNull();
        expect(inReview.data.websiteBuilder.publishPage.error).toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: {
                model: "wb.page",
                targetRevisionId: page.id,
                workflowId: "wb-workflow",
                reviewState: "inProgress"
            }
        });
        expect(withoutReview.data.websiteBuilder.publishPage.error).toEqual({
            code: "Workflows/Review/PublishBlocked",
            message:
                "This content can only be published after its review is approved. Request a review first.",
            data: {
                model: "wb.page",
                targetRevisionId: unreviewed.id,
                workflowId: "wb-workflow",
                reviewState: null
            }
        });
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `yarn test packages/api-website-builder/__tests__/pages.gql.errors.test.ts 2>&1 | tail -50`
Expected: FAIL in the first two tests: `expected { code: '', message: 'Not authorized!', … } to match object { code: 'WebsiteBuilder/Page/NotAuthorized', … }` and `expected { code: '', message: 'Page not found!', data: null, stack: null } to deeply equal { code: 'WebsiteBuilder/Page/NotFound', … }`. The third test passes (rejections already keep their code). Record the output.

Run: `yarn test packages/api-website-builder-scheduler/__tests__/publishPageError.test.ts 2>&1 | tail -50`
Expected: FAIL in both tests: `expected Error: Failed to publish page: … to be an instance of PageNotFoundError` and `expected Error: Failed to unpublish page: … to be an instance of PageNotFoundError`. Record the output.

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql/pagePublishBlocked.test.ts 2>&1 | tail -30`
Expected: PASS already (the blocked publish is a rejection, kept by `resolve()`); it pins Review Focus 5 for the WB resolvers.

- [ ] **Step 3: Keep the error in the page resolvers**

In `packages/api-website-builder/src/graphql/pages/pages.gql.ts`, replace every

```ts
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
```

with

```ts
                    if (result.isFail()) {
                        // `resolve()` turns it into `new ErrorResponse(result.error)`: code, message
                        // and data kept (R103).
                        throw result.error;
                    }
```

(twelve sites, listed above). Run: `grep -c "throw new Error(result.error.message)" packages/api-website-builder/src/graphql/pages/pages.gql.ts` Expected: `0`. Run: `grep -c "throw result.error;" packages/api-website-builder/src/graphql/pages/pages.gql.ts` Expected: `14` (the twelve plus `listPages` and `listDeletedPages`).

- [ ] **Step 4: Keep the error in the scheduler**

In `packages/api-website-builder-scheduler/src/features/PublishActionHandler/PublishPageActionHandler.ts`, replace

```ts
        if (result.isFail()) {
            console.error(`Failed to publish page "${action.targetId}":`, result.error);
            throw new Error(`Failed to publish page: ${action.targetId}`);
        }
```

with

```ts
        if (result.isFail()) {
            console.error(`Failed to publish page "${action.targetId}":`, result.error);
            // The use case's own error (code and data kept, e.g. a workflows publish block), so the
            // scheduler records it as `ExecutionFailedError.originalError` (R103).
            throw result.error;
        }
```

In `packages/api-website-builder-scheduler/src/features/UnpublishActionHandler/UnpublishPageActionHandler.ts`, replace

```ts
        if (result.isFail()) {
            console.error(`Failed to unpublish page "${action.targetId}":`, result.error);
            throw new Error(`Failed to unpublish page: ${action.targetId}`);
        }
```

with

```ts
        if (result.isFail()) {
            console.error(`Failed to unpublish page "${action.targetId}":`, result.error);
            // The use case's own error (code and data kept), so the scheduler records it as
            // `ExecutionFailedError.originalError` (R103).
            throw result.error;
        }
```

- [ ] **Step 5: The stale comment**

In `packages/api-website-builder-workflows/src/features/hooks/RequireApprovedReviewOnPagePublish.ts`, in the doc comment, replace

```
 * not a publish and is not blocked (D134 point 2). The throw rejects `PublishPageUseCase` (A26);
 * phase 3 maps it in the WB resolvers and the scheduler.
```

with

```
 * not a publish and is not blocked (D134 point 2). The throw rejects `PublishPageUseCase` (A26);
 * WB's page resolvers and the scheduler's publish action keep its code and data (R103).
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-website-builder 2>&1 | tail -30`
Expected: PASS (no existing test asserts the empty code).

Run: `yarn test packages/api-website-builder-scheduler 2>&1 | tail -30`
Expected: PASS.

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -30` and `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -30`
Expected: PASS (or "not run" recorded for OpenSearch, A9).

- [ ] **Step 7: Type-check**

Run: `yarn check:test:types 2>&1 | grep -iE "api-website-builder" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder`, `@webiny/api-website-builder-scheduler` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
fix(api-website-builder): keep error code and data in page resolvers and scheduled publish and unpublish

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
