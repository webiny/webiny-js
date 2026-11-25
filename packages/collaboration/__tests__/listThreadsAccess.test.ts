import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    ListThreadsRepository,
    ListThreadsUseCase
} from "~/api/features/thread/ListThreads/abstractions.js";
import { ListThreadsUseCase as ListThreadsUseCaseImplementation } from "~/api/features/thread/ListThreads/ListThreadsUseCase.js";
import { ResolveLocatorUseCase } from "~/api/features/locator/ResolveLocator/index.js";
import type { ICollabThread } from "~/api/domain/thread/abstractions.js";

const where = { contentType: "cms.entry", contentId: "article:entry-1" };

const createThread = (id: string) => {
    return { id, ...where, locator: "" } as unknown as ICollabThread;
};

describe("listing collaboration threads", () => {
    let container: Container;
    let anonymous: boolean;
    let authorizedThreadIds: string[];
    let repositoryCalls: number;

    const threads = [createThread("t1"), createThread("t2"), createThread("t3")];

    const listThreads = () => container.resolve(ListThreadsUseCase).execute({ where });

    beforeEach(() => {
        container = new Container();
        anonymous = false;
        authorizedThreadIds = threads.map(thread => thread.id);
        repositoryCalls = 0;

        container.registerInstance(IdentityContext, {
            getIdentity: () => ({ isAnonymous: () => anonymous })
        } as unknown as IdentityContext.Interface);

        container.registerInstance(ListThreadsRepository, {
            execute: async () => {
                repositoryCalls++;
                return Result.ok({
                    items: threads,
                    meta: { totalCount: 12, hasMoreItems: true, cursor: "next" }
                });
            }
        });

        // Each call resolves the next thread of the list, in order.
        let index = 0;
        container.registerInstance(ResolveLocatorUseCase, {
            execute: async () => {
                const thread = threads[index++ % threads.length];
                return Result.ok({ authorized: authorizedThreadIds.includes(thread.id) });
            }
        } as unknown as ResolveLocatorUseCase.Interface);

        container.register(ListThreadsUseCaseImplementation);
    });

    it("refuses an anonymous caller before loading anything", async () => {
        anonymous = true;

        const result = await listThreads();

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("Collaboration/Thread/NotAuthorized");
        expect(repositoryCalls).toBe(0);
    });

    it("returns the threads and the list meta to a caller with access", async () => {
        const result = await listThreads();

        expect(result.isOk()).toBe(true);
        expect(result.value.items.map(view => view.thread.id)).toEqual(["t1", "t2", "t3"]);
        expect(result.value.meta).toEqual({ totalCount: 12, hasMoreItems: true, cursor: "next" });
    });

    it("does not reveal how many threads exist to a caller without access", async () => {
        authorizedThreadIds = [];

        const result = await listThreads();

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toEqual([]);
        expect(result.value.meta).toEqual({ totalCount: 0, hasMoreItems: false, cursor: null });
    });

    it("does not count the threads it leaves out", async () => {
        authorizedThreadIds = ["t1", "t3"];

        const result = await listThreads();

        expect(result.isOk()).toBe(true);
        expect(result.value.items.map(view => view.thread.id)).toEqual(["t1", "t3"]);
        expect(result.value.meta).toEqual({ totalCount: 11, hasMoreItems: true, cursor: "next" });
    });
});
