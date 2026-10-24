### Task 3: WB `deletePageRevision` use case, events and GraphQL

Added at the user's request (Q14, Q15, R235, R236; D5, D97, D134 for the later block). The Website Builder API had only `WbMutation.deletePage(id, permanently)`; the admin `DeletePageRevisionGateway` (`packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.ts`) calls a `deletePageRevision(id)` mutation the server never defined. This is core Website Builder work inside the workflows phase. It changes no model, key or schema (A86): the use case delegates to the CMS `DeleteEntryRevisionUseCase` on the private page model, like `DeletePageRepository` delegates to `DeleteEntryUseCase`.

- `deletePageRevision(id: ID!): WbBooleanResponse` on `WbMutation`. `id` is the revision id (`<pageId>#<version>`), `data` is `true`, `error { code data message }` is the usual envelope; `ensureAuthentication`, `throw result.error` (the `resolve()` helper keeps code, message and data, R103).
- Use case: reads the revision with `GetPageByIdUseCase` (A84), `WbPermissions.canDelete("page", page)` else `PageNotAuthorizedError`, reads the page's revisions with `GetPageRevisionsUseCase` (A88) to learn whether it is the only one, publishes `PageRevisionBeforeDeleteEvent` and, for the only revision, the existing `PageBeforeDeleteEvent`, runs the repository, then `PageRevisionAfterDeleteEvent` and, for the only revision, `PageAfterDeleteEvent`. A before handler that throws refuses the delete (as in `DeletePageUseCase`). Nothing unpublishes or refuses a published revision (Q15, A85).
- CMS semantics (R236, unchanged): deleting the latest revision makes the previous one the latest; deleting the only revision deletes the entry. Only in that case do the page-delete subscribers (`CancelScheduledActionOnPageDeleteEventHandler`, the audit-log `PageAfterDeleteHandler`, the webhook `OnPageDeletedHandler`, workflows `BlockPageDeleteWhileInReview` and `DeleteReviewsOnPageDelete`) run, because the page-delete events are published as well.
- The new use case and both handler abstractions are exported like the page-delete ones (`packages/api-website-builder/src/exports/api/website-builder/page.ts` and `packages/webiny/src/api/website-builder/page.ts`).
- **Stop rule (A85, A86):** if a test shows a storage change would be needed (a model, key or schema change, or a storage behaviour that is unsafe for pages), stop, write nothing further and record an open question for the user. Do not change CMS storage code.
- **A85 reading, done before this plan was written** (record it in the commit): for a published revision, `DdbDeleteEntryRevision` and `DdbEsDeleteEntryRevision` delete the published pointer record (`createPublishedSortKey`) when the deleted revision is the published one; `SqlDeleteEntryRevision` sets `live = null` on every revision of the entry when the deleted row was published; `PgOsDeleteEntryRevision` removes the published search document (`removePublished`). No storage refuses and none unpublishes anything else; the page stops being live because its published pointer is gone. This is what the as-is pin below documents.

**Files:**
- Create: `packages/api-website-builder/src/features/pages/DeletePageRevision/abstractions.ts`
- Create: `packages/api-website-builder/src/features/pages/DeletePageRevision/events.ts`
- Create: `packages/api-website-builder/src/features/pages/DeletePageRevision/DeletePageRevisionRepository.ts`
- Create: `packages/api-website-builder/src/features/pages/DeletePageRevision/DeletePageRevisionUseCase.ts`
- Create: `packages/api-website-builder/src/features/pages/DeletePageRevision/feature.ts`
- Create: `packages/api-website-builder/src/features/pages/DeletePageRevision/index.ts`
- Modify: `packages/api-website-builder/src/WebsiteBuilderFeature.ts`
- Modify: `packages/api-website-builder/src/graphql/pages/pages.typeDefs.ts`
- Modify: `packages/api-website-builder/src/graphql/pages/pages.gql.ts`
- Modify: `packages/api-website-builder/src/exports/api/website-builder/page.ts`
- Modify: `packages/webiny/src/api/website-builder/page.ts`
- Modify: `packages/webiny/API_ABSTRACTIONS_REGISTRY.md` (three rows for the new abstractions, see Step 3)
- Create: `packages/api-website-builder/__tests__/pageRevisionDelete.test.ts`
- Create: `packages/api-website-builder/__tests__/pageRevisionDelete.gql.test.ts`
- Modify: `packages/api-website-builder/__tests__/graphql/pages.gql.ts` (the `DELETE_PAGE_REVISION` document)
- Existing, must stay green: `packages/api-website-builder/__tests__/pages.test.ts`, `pages.gql.test.ts`, `pages.permissions.test.ts`, `pages.permissions.own.test.ts`, `pages.permissions.finegrained.test.ts`

**Interfaces:**
- Consumes (existing): `DeleteEntryRevisionUseCase` (`@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision`), `PageModelProvider` (`~/domain/page/abstractions.js`), `PageNotFoundError`, `PagePersistenceError`, `PageNotAuthorizedError` (`~/domain/page/errors.js`), `WbPermissions` (`~/features/permissions/abstractions.js`), `GetPageByIdUseCase` (`~/features/pages/GetPageById/index.js`), `GetPageRevisionsUseCase` (`~/features/pages/GetPageRevisions/index.js`), `EventPublisher` and `DomainEvent` (`@webiny/api-core/features/eventPublisher/index.js`), `PageBeforeDeleteEvent`/`PageAfterDeleteEvent` (`~/features/pages/DeletePage/events.js`), the `deletePage` resolver pattern in `pages.gql.ts`.
- Produces: `IDeleteWbPageRevisionParams { id: string }`; `DeletePageRevisionRepository` (`"Wb/DeletePageRevisionRepository"`); `DeletePageRevisionUseCase` (`"Wb/DeletePageRevisionUseCase"`, `execute(params): Promise<Result<void, PageNotAuthorizedError | PageNotFoundError | PagePersistenceError>>`); `PageRevisionBeforeDeletePayload`/`PageRevisionAfterDeletePayload { page: WbPage }`; `PageRevisionBeforeDeleteEventHandler` (`"Wb/PageRevisionBeforeDeleteEventHandler"`) and `PageRevisionAfterDeleteEventHandler` (`"Wb/PageRevisionAfterDeleteEventHandler"`), each `IEventHandler<DomainEvent<Payload>>` with namespace `Interface`, `Event`, `Page`; events `PageRevisionBeforeDeleteEvent` (`"page.revision.beforeDelete"`), `PageRevisionAfterDeleteEvent` (`"page.revision.afterDelete"`); `DeletePageRevisionFeature` (`"WebsiteBuilder/DeletePageRevision"`); GraphQL `WbMutation.deletePageRevision(id: ID!): WbBooleanResponse`. Consumed by Task 4 (`@webiny/api-website-builder/features/pages/DeletePageRevision/index.js`), Task 32 and Task 36.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-website-builder/__tests__/pageRevisionDelete.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { until } from "@webiny/api/testing/until.js";
import type { Container } from "@webiny/di";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { BaseError } from "@webiny/feature/api";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { CreatePageRevisionFromUseCase } from "~/features/pages/CreatePageRevisionFrom/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";
import { PublishPageUseCase } from "~/features/pages/PublishPage/index.js";
import { PageAfterUnpublishEventHandler } from "~/features/pages/UnpublishPage/index.js";
import { PageBeforeUnpublishEventHandler } from "~/features/pages/UnpublishPage/index.js";
import { TrashPageUseCase } from "~/features/pages/TrashPage/index.js";
import { PageAfterDeleteEventHandler } from "~/features/pages/DeletePage/index.js";
import { PageBeforeDeleteEventHandler } from "~/features/pages/DeletePage/index.js";
import { DeletePageRevisionUseCase } from "~/features/pages/DeletePageRevision/index.js";
import { PageRevisionAfterDeleteEventHandler } from "~/features/pages/DeletePageRevision/index.js";
import { PageRevisionBeforeDeleteEventHandler } from "~/features/pages/DeletePageRevision/index.js";
import * as pageExports from "~/exports/api/website-builder/page.js";

const NOT_AUTHORIZED = "WebsiteBuilder/Page/NotAuthorized";
const NOT_FOUND = "WebsiteBuilder/Page/NotFound";

const identityA: IdentityData = { id: "identity-a", type: "admin", displayName: "User A" };
const identityB: IdentityData = { id: "identity-b", type: "admin", displayName: "User B" };

interface RecordedEvent {
    type: string;
    pageId: string;
}

/** Every lifecycle event the spy handlers saw, in order. Cleared before each test. */
const recorded: RecordedEvent[] = [];

class RecordRevisionBeforeDelete implements PageRevisionBeforeDeleteEventHandler.Interface {
    public async handle(event: PageRevisionBeforeDeleteEventHandler.Event): Promise<void> {
        recorded.push({ type: "revision.before", pageId: event.payload.page.id });
    }
}

class RecordRevisionAfterDelete implements PageRevisionAfterDeleteEventHandler.Interface {
    public async handle(event: PageRevisionAfterDeleteEventHandler.Event): Promise<void> {
        recorded.push({ type: "revision.after", pageId: event.payload.page.id });
    }
}

class RecordPageBeforeDelete implements PageBeforeDeleteEventHandler.Interface {
    public async handle(event: PageBeforeDeleteEventHandler.Event): Promise<void> {
        recorded.push({ type: "page.before", pageId: event.payload.page.id });
    }
}

class RecordPageAfterDelete implements PageAfterDeleteEventHandler.Interface {
    public async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        recorded.push({ type: "page.after", pageId: event.payload.page.id });
    }
}

class RecordBeforeUnpublish implements PageBeforeUnpublishEventHandler.Interface {
    public async handle(event: PageBeforeUnpublishEventHandler.Event): Promise<void> {
        recorded.push({ type: "unpublish.before", pageId: event.payload.page.id });
    }
}

class RecordAfterUnpublish implements PageAfterUnpublishEventHandler.Interface {
    public async handle(event: PageAfterUnpublishEventHandler.Event): Promise<void> {
        recorded.push({ type: "unpublish.after", pageId: event.payload.page.id });
    }
}

/** Refuses the delete, as the workflows block does, with a code and data. */
class RefusedError extends BaseError<{ reason: string }> {
    override readonly code = "Test/Refused" as const;

    public constructor() {
        super({ message: "Refused by a handler.", data: { reason: "in review" } });
    }
}

class RefuseRevisionDelete implements PageRevisionBeforeDeleteEventHandler.Interface {
    public async handle(): Promise<void> {
        throw new RefusedError();
    }
}

const registerSpies = (container: Container) => {
    container.register(
        PageRevisionBeforeDeleteEventHandler.createImplementation({
            implementation: RecordRevisionBeforeDelete,
            dependencies: []
        })
    );
    container.register(
        PageRevisionAfterDeleteEventHandler.createImplementation({
            implementation: RecordRevisionAfterDelete,
            dependencies: []
        })
    );
    container.register(
        PageBeforeDeleteEventHandler.createImplementation({
            implementation: RecordPageBeforeDelete,
            dependencies: []
        })
    );
    container.register(
        PageAfterDeleteEventHandler.createImplementation({
            implementation: RecordPageAfterDelete,
            dependencies: []
        })
    );
    container.register(
        PageBeforeUnpublishEventHandler.createImplementation({
            implementation: RecordBeforeUnpublish,
            dependencies: []
        })
    );
    container.register(
        PageAfterUnpublishEventHandler.createImplementation({
            implementation: RecordAfterUnpublish,
            dependencies: []
        })
    );
};

const registerRefusal = (container: Container) => {
    container.register(
        PageRevisionBeforeDeleteEventHandler.createImplementation({
            implementation: RefuseRevisionDelete,
            dependencies: []
        })
    );
};

const expectOk = <TValue, TError>(result: {
    isFail(): boolean;
    value: TValue;
    error: TError;
}): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

/** A page with `count` revisions (1, 2, ...), created as `identity` with full permissions. */
const createPageWithRevisions = async (count: number, identity: IdentityData = identityA) => {
    const handler = useHandler({ identity });
    const context = await handler.handler();
    const page = expectOk(await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA));
    const revisions = [page];
    for (let index = 1; index < count; index++) {
        const created = await context.container
            .resolve(CreatePageRevisionFromUseCase)
            .execute({ id: revisions[index - 1].id });
        revisions.push(expectOk(created));
    }
    return revisions;
};

const listRevisionVersions = async (context: ApiCoreContext, entryId: string) => {
    const result = await context.container.resolve(GetPageRevisionsUseCase).execute(entryId);
    return expectOk(result).map(page => page.version);
};

const createContext = async (params: { identity?: IdentityData; legacyPlugins?: unknown[] } = {}) => {
    const handler = useHandler({
        identity: params.identity ?? identityA,
        legacyPlugins: params.legacyPlugins ?? [registerSpies]
    });
    return handler.handler();
};

describe("DeletePageRevisionUseCase (R235, R236)", () => {
    beforeEach(() => {
        recorded.length = 0;
    });

    afterEach(() => {
        recorded.length = 0;
    });

    it("is registered and its handlers are exported", async () => {
        const context = await createContext();

        expect(context.container.resolveAll(DeletePageRevisionUseCase)).toHaveLength(1);
        expect(pageExports.DeletePageRevisionUseCase).toBe(DeletePageRevisionUseCase);
        expect(pageExports.PageRevisionBeforeDeleteEventHandler).toBe(
            PageRevisionBeforeDeleteEventHandler
        );
        expect(pageExports.PageRevisionAfterDeleteEventHandler).toBe(
            PageRevisionAfterDeleteEventHandler
        );
    });

    it("reads a middle revision by its own id, not the latest (A84)", async () => {
        const [, second] = await createPageWithRevisions(3);
        const context = await createContext();

        const read = expectOk(await context.container.resolve(GetPageByIdUseCase).execute(second.id));

        expect(read.id).toBe(second.id);
        expect(read.version).toBe(2);
    });

    it("deletes a middle revision and runs only the revision handlers", async () => {
        const [first, second, third] = await createPageWithRevisions(3);
        const context = await createContext();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: second.id });

        expect(result.isOk()).toBe(true);
        expect(recorded).toEqual([
            { type: "revision.before", pageId: second.id },
            { type: "revision.after", pageId: second.id }
        ]);
        const versions = await until(
            () => listRevisionVersions(context, first.entryId),
            (items: number[]) => items.length === 2,
            { tries: 10 }
        );
        expect(versions).toEqual([1, 3]);
        const latest = expectOk(
            await context.container.resolve(GetPageByIdUseCase).execute(third.id)
        );
        expect(latest.version).toBe(3);
    });

    it("makes the previous revision the latest when the latest one is deleted", async () => {
        const [first, second, third] = await createPageWithRevisions(3);
        const context = await createContext();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: third.id });

        expect(result.isOk()).toBe(true);
        const versions = await until(
            () => listRevisionVersions(context, first.entryId),
            (items: number[]) => items.length === 2,
            { tries: 10 }
        );
        expect(versions).toEqual([1, 2]);
        const revisions = expectOk(
            await context.container.resolve(GetPageRevisionsUseCase).execute(first.entryId)
        );
        const latest = revisions[revisions.length - 1];
        expect(latest.id).toBe(second.id);
        expect(latest.version).toBe(2);
        expect(recorded.map(item => item.type)).toEqual(["revision.before", "revision.after"]);
    });

    it("deletes the page and publishes the page-delete events when its only revision is deleted", async () => {
        const [only] = await createPageWithRevisions(1);
        const context = await createContext();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: only.id });

        expect(result.isOk()).toBe(true);
        expect(recorded).toEqual([
            { type: "revision.before", pageId: only.id },
            { type: "page.before", pageId: only.id },
            { type: "revision.after", pageId: only.id },
            { type: "page.after", pageId: only.id }
        ]);
        const gone = await until(
            () => context.container.resolve(GetPageByIdUseCase).execute(only.id),
            (read: { isFail(): boolean }) => read.isFail(),
            { tries: 10 }
        );
        expect(gone.isFail()).toBe(true);
        expect(gone.error.code).toBe(NOT_FOUND);
    });

    it("does not run the page-delete handlers while other revisions remain", async () => {
        const [first] = await createPageWithRevisions(2);
        const context = await createContext();

        expectOk(await context.container.resolve(DeletePageRevisionUseCase).execute({ id: first.id }));

        expect(recorded.map(item => item.type)).toEqual(["revision.before", "revision.after"]);
    });

    it("deletes a published revision exactly as today: not refused, no unpublish handling (A85, Q15)", async () => {
        const [first, second] = await createPageWithRevisions(2);
        const seed = await createContext({ legacyPlugins: [] });
        expectOk(await seed.container.resolve(PublishPageUseCase).execute({ id: first.id }));
        const context = await createContext();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: first.id });

        expect(result.isOk()).toBe(true);
        expect(recorded.map(item => item.type)).toEqual(["revision.before", "revision.after"]);
        const versions = await until(
            () => listRevisionVersions(context, first.entryId),
            (items: number[]) => items.length === 1,
            { tries: 10 }
        );
        expect(versions).toEqual([2]);
        const remaining = expectOk(
            await context.container.resolve(GetPageRevisionsUseCase).execute(first.entryId)
        );
        expect(remaining.map(page => page.status)).toEqual(["draft"]);
        expect(remaining.some(page => page.status === "published")).toBe(false);
    });

    it("maps an unknown revision id to a not found error", async () => {
        const context = await createContext();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: "missing-page#0001" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe(NOT_FOUND);
        expect(recorded).toEqual([]);
    });

    it("refuses a user who can read the page but not delete it, and keeps the revision", async () => {
        const [first] = await createPageWithRevisions(2);
        const reader = useHandler({
            identity: identityB,
            permissions: [{ name: "wb.page", rwd: "r" }],
            legacyPlugins: [registerSpies]
        });
        const context = await reader.handler();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: first.id });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe(NOT_AUTHORIZED);
        expect(recorded).toEqual([]);
        expect(await listRevisionVersions(context, first.entryId)).toEqual([1, 2]);
    });

    it("enforces the own scope: a user cannot delete a revision of another user's page", async () => {
        const [first] = await createPageWithRevisions(2, identityA);
        const handler = useHandler({
            identity: identityB,
            permissions: [{ name: "wb.page", own: true, rwd: "rwd" }],
            legacyPlugins: [registerSpies]
        });
        const context = await handler.handler();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: first.id });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe(NOT_AUTHORIZED);
        expect(recorded).toEqual([]);
    });

    it("lets the owner delete a revision with the own scope", async () => {
        const [first] = await createPageWithRevisions(2, identityA);
        const handler = useHandler({
            identity: identityA,
            permissions: [{ name: "wb.page", own: true, rwd: "rwd" }],
            legacyPlugins: [registerSpies]
        });
        const context = await handler.handler();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: first.id });

        expect(result.isOk()).toBe(true);
    });

    it.each([
        { label: "rwd=rw", permissions: [{ name: "wb.page", rwd: "rw" }] },
        { label: "rwd=r", permissions: [{ name: "wb.page", rwd: "r" }] }
    ])("refuses fine-grained permissions without delete ($label)", async ({ permissions }) => {
        // Mirrors pages.permissions.finegrained.test.ts: `d` is what `canDelete` needs.
        const [first] = await createPageWithRevisions(2);
        const handler = useHandler({ permissions, legacyPlugins: [registerSpies] });
        const context = await handler.handler();

        const result = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: first.id });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe(NOT_AUTHORIZED);
        expect(recorded).toEqual([]);
        expect(await listRevisionVersions(context, first.entryId)).toEqual([1, 2]);
    });

    it("rejects with the handler's error and leaves the revision intact when a before handler throws", async () => {
        const [first] = await createPageWithRevisions(2);
        const context = await createContext({ legacyPlugins: [registerSpies, registerRefusal] });

        await expect(
            context.container.resolve(DeletePageRevisionUseCase).execute({ id: first.id })
        ).rejects.toMatchObject({ code: "Test/Refused", data: { reason: "in review" } });

        expect(await listRevisionVersions(context, first.entryId)).toEqual([1, 2]);
        expect(recorded.map(item => item.type)).not.toContain("revision.after");
    });

    describe("GetPageRevisionsUseCase lists every non-deleted revision (A88)", () => {
        it("returns one item for a page with one revision", async () => {
            const [only] = await createPageWithRevisions(1);
            const context = await createContext();

            expect(await listRevisionVersions(context, only.entryId)).toEqual([1]);
        });

        it("returns one item for a published page with one revision", async () => {
            const [only] = await createPageWithRevisions(1);
            const context = await createContext();
            expectOk(await context.container.resolve(PublishPageUseCase).execute({ id: only.id }));

            expect(await listRevisionVersions(context, only.entryId)).toEqual([1]);
        });

        it("returns the revision of a trashed page", async () => {
            const [only] = await createPageWithRevisions(1);
            const context = await createContext();
            expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: only.id }));

            expect(await listRevisionVersions(context, only.entryId)).toEqual([1]);
        });
    });
});
```

Create `packages/api-website-builder/__tests__/pageRevisionDelete.gql.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { until } from "@webiny/api/testing/until.js";
import type { Container } from "@webiny/di";
import { BaseError } from "@webiny/feature/api";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { PageRevisionBeforeDeleteEventHandler } from "~/features/pages/DeletePageRevision/index.js";
import { DELETE_PAGE_REVISION } from "./graphql/pages.gql.js";
import { GET_PAGE_BY_ID } from "./graphql/pages.gql.js";
import { GET_PAGE_REVISIONS } from "./graphql/pages.gql.js";

class RefusedError extends BaseError<{ reason: string }> {
    override readonly code = "Test/Refused" as const;

    public constructor() {
        super({ message: "Refused by a handler.", data: { reason: "in review" } });
    }
}

class RefuseRevisionDelete implements PageRevisionBeforeDeleteEventHandler.Interface {
    public async handle(): Promise<void> {
        throw new RefusedError();
    }
}

const registerRefusal = (container: Container) => {
    container.register(
        PageRevisionBeforeDeleteEventHandler.createImplementation({
            implementation: RefuseRevisionDelete,
            dependencies: []
        })
    );
};

interface PageRow {
    id: string;
    entryId: string;
    version: number;
}

/** A page with two revisions, created through GraphQL. */
const createPageWithTwoRevisions = async (handler: ReturnType<typeof useGraphQlHandler>) => {
    const [created] = await handler.wb.createPage({ data: pageMocks.pageA });
    const first: PageRow = created.data.websiteBuilder.createPage.data;
    const [revised] = await handler.wb.createPageRevisionFrom({ id: first.id });
    const second: PageRow = revised.data.websiteBuilder.createPageRevisionFrom.data;
    return { first, second };
};

describe("WbMutation.deletePageRevision (R235)", () => {
    it("deletes a revision and answers true", async () => {
        const handler = useGraphQlHandler();
        const { first, second } = await createPageWithTwoRevisions(handler);

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: first.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({ data: true, error: null });
        const revisions = await until(
            () =>
                handler.invoke({
                    body: { query: GET_PAGE_REVISIONS, variables: { entryId: first.entryId } }
                }),
            ([response]: any[]) => response.data.websiteBuilder.getPageRevisions.data.length === 1,
            { tries: 10 }
        );
        expect(revisions[0].data.websiteBuilder.getPageRevisions.data[0].id).toBe(second.id);
    });

    it("deletes the page when its only revision is deleted", async () => {
        const handler = useGraphQlHandler();
        const [created] = await handler.wb.createPage({ data: pageMocks.pageA });
        const page: PageRow = created.data.websiteBuilder.createPage.data;

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: page.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({ data: true, error: null });
        await until(
            () => handler.invoke({ body: { query: GET_PAGE_BY_ID, variables: { id: page.id } } }),
            ([response]: any[]) => response.data.websiteBuilder.getPageById.data === null,
            { tries: 10 }
        );
    });

    it("answers a not found error with its code and data for an unknown revision", async () => {
        const handler = useGraphQlHandler();

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: "missing-page#0001" } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({
            data: null,
            error: {
                code: "WebsiteBuilder/Page/NotFound",
                message: "Page not found!",
                data: { id: "missing-page#0001" }
            }
        });
    });

    it("answers the handler's error with its code and data when a before handler refuses", async () => {
        const handler = useGraphQlHandler({ legacyPlugins: [registerRefusal] });
        const { first } = await createPageWithTwoRevisions(handler);

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: first.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({
            data: null,
            error: {
                code: "Test/Refused",
                message: "Refused by a handler.",
                data: { reason: "in review" }
            }
        });
    });

    it("answers not authorized for a user without delete permission", async () => {
        const admin = useGraphQlHandler();
        const { first } = await createPageWithTwoRevisions(admin);
        const reader = useGraphQlHandler({ permissions: [{ name: "wb.page", rwd: "r" }] });

        const [body] = await reader.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: first.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision.data).toBeNull();
        expect(body.data.websiteBuilder.deletePageRevision.error.code).toBe(
            "WebsiteBuilder/Page/NotAuthorized"
        );
    });
});
```

Add the mutation document to `packages/api-website-builder/__tests__/graphql/pages.gql.ts`, after `DELETE_PAGE`:

```ts
export const DELETE_PAGE_REVISION = /* GraphQL */ `
    mutation DeletePageRevision($id: ID!) {
        websiteBuilder {
            deletePageRevision(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-website-builder/__tests__/pageRevisionDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder/__tests__/pageRevisionDelete.gql.test.ts 2>&1 | tail -50
```

Expected: FAIL. The use-case test cannot resolve `~/features/pages/DeletePageRevision/index.js`; the GraphQL test fails with `Cannot query field "deletePageRevision" on type "WbMutation"`.

- [ ] **Step 3: Implement**

`packages/api-website-builder/src/features/pages/DeletePageRevision/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { PageNotFoundError } from "~/domain/page/errors.js";
import type { PagePersistenceError } from "~/domain/page/errors.js";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDeleteWbPageRevisionParams {
    /** The revision id, `<pageId>#<version>`. */
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IDeletePageRevisionRepository {
    execute(params: IDeleteWbPageRevisionParams): Promise<Result<void, RepositoryError>>;
}

export interface IDeletePageRevisionRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    IDeletePageRevisionRepositoryErrors[keyof IDeletePageRevisionRepositoryErrors];

export const DeletePageRevisionRepository = createAbstraction<IDeletePageRevisionRepository>(
    "Wb/DeletePageRevisionRepository"
);

export namespace DeletePageRevisionRepository {
    export type Interface = IDeletePageRevisionRepository;
    export type Params = IDeleteWbPageRevisionParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDeletePageRevisionUseCase {
    execute(params: IDeleteWbPageRevisionParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeletePageRevisionUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IDeletePageRevisionUseCaseErrors[keyof IDeletePageRevisionUseCaseErrors];

/**
 * Delete one revision of a page. Deleting the latest revision makes the previous one the latest;
 * deleting the only revision deletes the page, and the page-delete events are published as well.
 */
export const DeletePageRevisionUseCase = createAbstraction<IDeletePageRevisionUseCase>(
    "Wb/DeletePageRevisionUseCase"
);

export namespace DeletePageRevisionUseCase {
    export type Interface = IDeletePageRevisionUseCase;
    export type Params = IDeleteWbPageRevisionParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageRevisionBeforeDeletePayload {
    page: WbPage;
}

export interface PageRevisionAfterDeletePayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into page lifecycle before a page revision is deleted. */
export const PageRevisionBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageRevisionBeforeDeletePayload>>
>("Wb/PageRevisionBeforeDeleteEventHandler");

export namespace PageRevisionBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageRevisionBeforeDeletePayload>>;
    export type Event = DomainEvent<PageRevisionBeforeDeletePayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a page revision is deleted. */
export const PageRevisionAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageRevisionAfterDeletePayload>>
>("Wb/PageRevisionAfterDeleteEventHandler");

export namespace PageRevisionAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageRevisionAfterDeletePayload>>;
    export type Event = DomainEvent<PageRevisionAfterDeletePayload>;
    export type Page = WbPage;
}
```

`packages/api-website-builder/src/features/pages/DeletePageRevision/events.ts`:

```ts
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageRevisionAfterDeleteEventHandler } from "./abstractions.js";
import { PageRevisionBeforeDeleteEventHandler } from "./abstractions.js";
import type { PageRevisionAfterDeletePayload } from "./abstractions.js";
import type { PageRevisionBeforeDeletePayload } from "./abstractions.js";

// PageRevisionBeforeDelete Event
export class PageRevisionBeforeDeleteEvent extends DomainEvent<PageRevisionBeforeDeletePayload> {
    eventType = "page.revision.beforeDelete" as const;

    getHandlerAbstraction() {
        return PageRevisionBeforeDeleteEventHandler;
    }
}

// PageRevisionAfterDelete Event
export class PageRevisionAfterDeleteEvent extends DomainEvent<PageRevisionAfterDeletePayload> {
    eventType = "page.revision.afterDelete" as const;

    getHandlerAbstraction() {
        return PageRevisionAfterDeleteEventHandler;
    }
}
```

`packages/api-website-builder/src/features/pages/DeletePageRevision/DeletePageRevisionRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision";
import { DeletePageRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModelProvider } from "~/domain/page/abstractions.js";
import { PageNotFoundError } from "~/domain/page/errors.js";
import { PagePersistenceError } from "~/domain/page/errors.js";

class DeletePageRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntryRevision: DeleteEntryRevisionUseCase.Interface,
        private pageModelProvider: PageModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // The CMS use case holds the semantics: the latest revision hands over to the previous
        // one, and the only revision deletes the entry (R236).
        const result = await this.deleteEntryRevision.execute(pageModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeletePageRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeletePageRevisionRepositoryImpl,
    dependencies: [DeleteEntryRevisionUseCase, PageModelProvider]
});
```

`packages/api-website-builder/src/features/pages/DeletePageRevision/DeletePageRevisionUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { DeletePageRevisionRepository } from "./abstractions.js";
import { DeletePageRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PageRevisionAfterDeleteEvent } from "./events.js";
import { PageRevisionBeforeDeleteEvent } from "./events.js";
import { PageAfterDeleteEvent } from "~/features/pages/DeletePage/events.js";
import { PageBeforeDeleteEvent } from "~/features/pages/DeletePage/events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";

class DeletePageRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private getPageRevisions: GetPageRevisionsUseCase.Interface,
        private repository: DeletePageRevisionRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Read the revision first: the events carry it, and the permission check is item-level.
        const getResult = await this.getPageById.execute(params.id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        const page = getResult.value;

        const canDelete = await this.permissions.canDelete("page", page);
        if (!canDelete) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // A page with one revision is deleted with it, so the page-delete subscribers must run too.
        const revisionsResult = await this.getPageRevisions.execute(page.entryId);
        if (revisionsResult.isFail()) {
            return Result.fail(revisionsResult.error);
        }
        const isOnlyRevision = revisionsResult.value.length === 1;

        // A handler that throws refuses the delete, as in `DeletePageUseCase`.
        await this.eventPublisher.publish(new PageRevisionBeforeDeleteEvent({ page }));
        if (isOnlyRevision) {
            await this.eventPublisher.publish(new PageBeforeDeleteEvent({ page }));
        }

        const result = await this.repository.execute(params);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new PageRevisionAfterDeleteEvent({ page }));
        if (isOnlyRevision) {
            await this.eventPublisher.publish(new PageAfterDeleteEvent({ page }));
        }

        return Result.ok();
    }
}

export const DeletePageRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageRevisionUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetPageByIdUseCase,
        GetPageRevisionsUseCase,
        DeletePageRevisionRepository
    ]
});
```

`packages/api-website-builder/src/features/pages/DeletePageRevision/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DeletePageRevisionRepository } from "./DeletePageRevisionRepository.js";
import { DeletePageRevisionUseCase } from "./DeletePageRevisionUseCase.js";

export const DeletePageRevisionFeature = createFeature({
    name: "WebsiteBuilder/DeletePageRevision",
    register(container) {
        container.register(DeletePageRevisionRepository).inSingletonScope();
        container.register(DeletePageRevisionUseCase);
    }
});
```

`packages/api-website-builder/src/features/pages/DeletePageRevision/index.ts`:

```ts
export {
    DeletePageRevisionUseCase,
    PageRevisionAfterDeleteEventHandler,
    PageRevisionBeforeDeleteEventHandler
} from "./abstractions.js";
```

`packages/api-website-builder/src/WebsiteBuilderFeature.ts`, the import next to the `DeletePageFeature` import and the registration next to `DeletePageFeature.register(container);`:

```ts
import { DeletePageFeature } from "./features/pages/DeletePage/feature.js";
import { DeletePageRevisionFeature } from "./features/pages/DeletePageRevision/feature.js";
```

```ts
        DeletePageFeature.register(container);
        DeletePageRevisionFeature.register(container);
```

`packages/api-website-builder/src/graphql/pages/pages.typeDefs.ts`, in `extend type WbMutation`:

```graphql
        deletePage(id: ID!, permanently: Boolean): WbBooleanResponse
        deletePageRevision(id: ID!): WbBooleanResponse
```

`packages/api-website-builder/src/graphql/pages/pages.gql.ts`, the import next to the `DeletePageUseCase` import, and the resolver before `WbMutation.restorePage`:

```ts
import { DeletePageRevisionUseCase } from "~/features/pages/DeletePageRevision/index.js";
```

```ts
    builder.addResolver({
        path: "WbMutation.deletePageRevision",
        dependencies: [DeletePageRevisionUseCase],
        resolver(deletePageRevision) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await deletePageRevision.execute({
                        id: args.id
                    });

                    if (result.isFail()) {
                        // `resolve()` turns it into `new ErrorResponse(result.error)`: code, message
                        // and data kept (R103).
                        throw result.error;
                    }

                    return true;
                });
        }
    });
```

`packages/api-website-builder/src/exports/api/website-builder/page.ts`, after the `DeletePage` export block:

```ts
export {
    DeletePageRevisionUseCase,
    PageRevisionAfterDeleteEventHandler,
    PageRevisionBeforeDeleteEventHandler
} from "~/features/pages/DeletePageRevision/abstractions.js";
```

`packages/webiny/src/api/website-builder/page.ts`, after the `DeletePage` export block:

```ts
export {
    DeletePageRevisionUseCase,
    PageRevisionAfterDeleteEventHandler,
    PageRevisionBeforeDeleteEventHandler
} from "@webiny/api-website-builder/features/pages/DeletePageRevision/abstractions.js";
```

`packages/webiny/API_ABSTRACTIONS_REGISTRY.md`, add three rows after the `DeletePageUseCase` row (line 307) and after the `PageAfterDeleteEventHandler` row (line 322), in the table's column format (re-align the padding the way the file's formatter does; if the file is generated, regenerate it with the repo's script instead, and if neither is possible record it as stale in the commit body):

```md
| `DeletePageRevisionUseCase`                | `@webiny/api-website-builder/features/pages/DeletePageRevision/abstractions.js`     |
| `PageRevisionBeforeDeleteEventHandler`     | `@webiny/api-website-builder/features/pages/DeletePageRevision/abstractions.js`     |
| `PageRevisionAfterDeleteEventHandler`      | `@webiny/api-website-builder/features/pages/DeletePageRevision/abstractions.js`     |
```

- [ ] **Step 4: Run the new tests on both storages, expect pass**

Run one command at a time:

```bash
yarn test packages/api-website-builder/__tests__/pageRevisionDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder/__tests__/pageRevisionDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder/__tests__/pageRevisionDelete.gql.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder/__tests__/pageRevisionDelete.gql.test.ts 2>&1 | tail -50
```

Expected: PASS. If a test shows a storage difference for the published revision case or the trashed-page revision list, apply the stop rule above and record the finding as an open question.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-website-builder/__tests__/pages.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder/__tests__/pages.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder/__tests__/pages.gql.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder/__tests__/pages.gql.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder/__tests__/pages.permissions.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder/__tests__/pages.permissions.own.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder/__tests__/pages.permissions.finegrained.test.ts 2>&1 | tail -50
yarn check:test:types -p api-website-builder --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (the task adds an export other packages import, so `@webiny/api-website-builder` and `@webiny/webiny` are built) and restore `.gitleaks.toml`:

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
yarn build -p @webiny/api-website-builder --no-cache 2>&1 | tail -30
yarn build -p @webiny/webiny --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-website-builder): add the deletePageRevision mutation" -m "Published revisions delete as before: Ddb and DdbEs remove the published pointer record of the deleted revision, Sql clears the live pointer on every revision, PgOs removes the published search document; no unpublish handling is added." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

## Contract notes

- **Unverified code.** The code and tests of this task were written from code read with codegraph and file reads and were **not run** when this plan was written. The implementer runs them in Steps 2 and 4; assumptions are marked "verify:" below.
- A88 trashed page: pinned as `[1]` in a test, derived from code (`GetRevisionsByEntryIdUseCase` has no deleted-entry filter), not run. If a storage returns `[]` here, change the expectation and record it in the commit; the revision delete does not depend on it.
- The webhook `OnPageDeletedHandler` was not found under `packages/webhooks/src` when this plan was written: the implementer locates it (`grep -rn "OnPageDeleted" packages --include=*.ts`), reads its body (it receives a live, non-trashed page in the only-revision case) and records the result in the commit.
- verify: the own-scope tests use `{ name: "wb.page", own: true, rwd: "rwd" }` (own deletes allowed, other users' pages refused); the read-only and `rwd: "rw"` cases mirror `pages.permissions.finegrained.test.ts`.
- verify: a handler registered with `container.register(<Handler>.createImplementation(...))` inside a `legacyPlugins` function runs for page and revision events (same mechanism as `registerAco` in `pageFolderDelete.test.ts`).
