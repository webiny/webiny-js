import { describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import { createTaskCrud } from "~/api/crud/crud.tasks.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/*
 * A task that has failed must report failed, with its error, from every read path.
 *
 * On the deployed system these two disagreed: `listTasks` reported a task `failed` while `getTask`
 * reported it `running` with no error, and reported a finished task `pending` seven minutes after it
 * finished — because fetching an entry by id goes through a DataLoader registered in singleton scope,
 * which memoises per warm Lambda container. `getTask` now reads through the same query path
 * `listTasks` uses, so the two cannot drift apart. See the issue filed against
 * @webiny/api-headless-cms-ddb for the underlying fix.
 */

const FAILED_ENTRY = {
    entryId: "task-1",
    createdOn: "2026-09-22T10:00:00.000Z",
    savedOn: "2026-09-22T10:05:00.000Z",
    createdBy: { id: "u", displayName: "u", type: "user" },
    values: {
        name: "Theme from example.com",
        definitionId: "themeExtraction",
        input: {},
        output: { error: { message: "did not finish within 60000ms" } },
        taskStatus: "failed",
        executionName: "themeExtraction_task-1",
        eventResponse: {},
        startedOn: "2026-09-22T10:00:00.000Z",
        finishedOn: "2026-09-22T10:05:00.000Z",
        iterations: 1
    }
};

const createContainer = (listExecute: ReturnType<typeof vi.fn>) => {
    const byId = vi.fn();
    const container = {
        resolve: (token: unknown) => {
            if (token === IdentityContext) {
                return { withoutAuthorization: async (cb: () => unknown) => cb() };
            }
            if (token === GetModelUseCase) {
                return {
                    execute: async () => ({
                        isFail: () => false,
                        value: { modelId: "webinyTask", fields: [] }
                    })
                };
            }
            if (token === ListLatestEntriesUseCase) {
                return { execute: listExecute };
            }
            if (token === GetEntryByIdUseCase) {
                return { execute: byId };
            }
            if (token === CmsWhereMapper) {
                return { map: ({ input }: { input: unknown }) => input };
            }
            return {};
        }
    } as unknown as Container;

    return { container, byId };
};

describe("a failed task reads as failed from every path", () => {
    it("reports failed, with its error, through getTask and listTasks alike", async () => {
        const listExecute = vi.fn(async () => ({
            isFail: () => false,
            value: { entries: [FAILED_ENTRY], meta: { totalCount: 1, hasMoreItems: false } }
        }));
        const { container } = createContainer(listExecute);
        const crud = createTaskCrud(container);

        const one = await crud.getTask("task-1");
        const many = await crud.listTasks();

        expect(one?.taskStatus).toBe("failed");
        expect(many.items[0].taskStatus).toBe("failed");
        expect(one?.taskStatus).toBe(many.items[0].taskStatus);
        expect(one?.output).toEqual({ error: { message: "did not finish within 60000ms" } });
    });

    /*
     * The by-id DataLoader is the stale reader, so `getTask` must not touch it — a regression that
     * restored the old read would put the disagreement straight back.
     */
    it("does not read the task through the by-id path", async () => {
        const listExecute = vi.fn(async () => ({
            isFail: () => false,
            value: { entries: [FAILED_ENTRY], meta: { totalCount: 1, hasMoreItems: false } }
        }));
        const { container, byId } = createContainer(listExecute);
        const crud = createTaskCrud(container);

        await crud.getTask("task-1");

        expect(byId).not.toHaveBeenCalled();
        expect(listExecute).toHaveBeenCalledTimes(1);
    });

    it("filters by the revision id, since a task's own id is the entry id", async () => {
        const listExecute = vi.fn(async () => ({
            isFail: () => false,
            value: { entries: [FAILED_ENTRY], meta: { totalCount: 1, hasMoreItems: false } }
        }));
        const { container } = createContainer(listExecute);
        const crud = createTaskCrud(container);

        await crud.getTask("task-1");

        const [, params] = listExecute.mock.calls[0] as [unknown, { where: { id: string } }];
        expect(params.where.id).toBe("task-1#0001");
    });

    /*
     * A where clause that stopped filtering would otherwise hand back whichever task came first, so
     * the match is confirmed rather than assumed.
     */
    it("returns nothing when the list hands back a different task", async () => {
        const listExecute = vi.fn(async () => ({
            isFail: () => false,
            value: {
                entries: [{ ...FAILED_ENTRY, entryId: "someone-elses-task" }],
                meta: { totalCount: 1, hasMoreItems: false }
            }
        }));
        const { container } = createContainer(listExecute);
        const crud = createTaskCrud(container);

        expect(await crud.getTask("task-1")).toBeNull();
    });

    it("returns nothing when there is no such task", async () => {
        const listExecute = vi.fn(async () => ({
            isFail: () => false,
            value: { entries: [], meta: { totalCount: 0, hasMoreItems: false } }
        }));
        const { container } = createContainer(listExecute);
        const crud = createTaskCrud(container);

        expect(await crud.getTask("task-1")).toBeNull();
    });
});
