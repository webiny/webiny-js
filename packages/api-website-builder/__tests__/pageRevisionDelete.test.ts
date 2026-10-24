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
    const page = expectOk(
        await context.container.resolve(CreatePageUseCase).execute(pageMocks.pageA)
    );
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

const createContext = async (
    params: { identity?: IdentityData; legacyPlugins?: unknown[] } = {}
) => {
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

        const read = expectOk(
            await context.container.resolve(GetPageByIdUseCase).execute(second.id)
        );

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

        expectOk(
            await context.container.resolve(DeletePageRevisionUseCase).execute({ id: first.id })
        );

        expect(recorded.map(item => item.type)).toEqual(["revision.before", "revision.after"]);
    });

    it("deletes a published revision exactly as today: not refused, no unpublish handling (A85, Q15)", async () => {
        const [first] = await createPageWithRevisions(2);
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
