import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import { ActivityLogStorage } from "~/api/core/abstractions.js";
import { ActivityLogModelProvider } from "~/api/storage/privateModel/abstractions.js";
import { PrivateModelActivityLogStorage } from "~/api/storage/privateModel/PrivateModelActivityLogStorage.js";

/**
 * The scan bound on `findStaleValues`, which the conformance suite cannot reach.
 *
 * Crossing it needs more records than a conformance run can reasonably write — twenty passes of a
 * hundred — so the reads are stubbed here and the adapter is driven past its own bound directly.
 * Deliberately not in the conformance file: this asserts one implementation's bound, not the
 * contract, and a replacement store would have its own.
 *
 * What is being protected is reachability. A search that always restarted would see only the
 * records inside one call's reach, and since settled records stay exactly where they are, on a
 * model any larger than that everything beyond it would be invisible for good.
 */

const PAGE_SIZE = 100;
const MAX_PASSES = 20;
const REACH = PAGE_SIZE * MAX_PASSES;

const entry = (sequence: number, stale: boolean) => ({
    id: `rec-${sequence}`,
    values: {
        sequence: String(sequence).padStart(8, "0"),
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actorId: "u-1",
        actorType: "admin",
        actorDisplayName: "Ada",
        action: "entry.update",
        source: "admin",
        correlationId: "c1",
        changeset: [],
        truncated: false,
        summaryValues: stale ? [{ path: "body", label: "Body", before: "a", after: "b" }] : null,
        summaryValuesWrittenOn: stale ? "2020-01-01T00:00:00.000Z" : null
    }
});

interface Options {
    /** How many records the fake model holds. `Infinity` for a model that never ends. */
    total?: number;
    /** Which of them carry values old enough to sweep. */
    isStale?: (sequence: number) => boolean;
}

/**
 * A fake model that honours `sequence_gt` and the page size, so the adapter's own paging is what
 * is under test rather than a stub that hands back whatever was asked for.
 */
const subject = (options: Options = {}) => {
    const container = new Container();
    const total = options.total ?? Infinity;
    const isStale = options.isStale ?? (() => false);

    const execute = vi.fn(async (_model: unknown, params: { where?: any; limit?: number }) => {
        const after = params.where?.values?.sequence_gt;
        const from = after === undefined ? 0 : Number.parseInt(after, 10) + 1;
        const size = Math.min(params.limit ?? PAGE_SIZE, Math.max(0, total - from));
        const entries = Array.from({ length: size }, (_, i) => entry(from + i, isStale(from + i)));

        return Result.ok({
            entries,
            meta: { totalCount: 0, cursor: null, hasMoreItems: false }
        });
    });

    container.registerInstance(ActivityLogModelProvider, {
        get: async () => ({ modelId: "activity", fields: [] })
    } as never);
    container.registerInstance(ListLatestEntriesUseCase, { execute } as never);
    container.registerInstance(CmsWhereMapper, {
        map: ({ input }: { input: object }) => ({ values: input })
    } as never);
    container.registerInstance(CreateEntryUseCase, { execute: vi.fn() } as never);
    container.registerInstance(DeleteEntryUseCase, { execute: vi.fn() } as never);
    container.registerInstance(UpdateEntryUseCase, { execute: vi.fn() } as never);
    container.registerInstance(GetEntryByIdUseCase, { execute: vi.fn() } as never);
    container.register(PrivateModelActivityLogStorage);

    return { storage: container.resolve(ActivityLogStorage), execute };
};

const find = async (
    storage: ActivityLogStorage.Interface,
    params: Partial<ActivityLogStorage.StaleValuesParams> = {}
) => {
    const result = await storage.findStaleValues({ writtenBefore: "2021-01-01", ...params });
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("reaching past one call's bound", () => {
    it("hands back a cursor instead of claiming the model is clean", async () => {
        // Twenty full pages of records that do not qualify. The scan runs out before the data does.
        const { storage, execute } = subject();

        const result = await find(storage);

        expect(result.records).toHaveLength(0);
        expect(result.cursor).not.toBeNull();
        expect(execute).toHaveBeenCalledTimes(MAX_PASSES);
    });

    it("finds a record that sits beyond one call's reach", async () => {
        // The failure this exists to prevent: without a resumable cursor this record is unreachable
        // for the life of the installation, because the records ahead of it never go away.
        const beyond = REACH + 500;
        const { storage } = subject({ total: beyond + 1, isStale: s => s === beyond });

        let cursor: string | null | undefined = undefined;
        let found: string[] = [];

        // As the sweeper does it: keep going while a cursor comes back.
        for (let call = 0; call < 10 && cursor !== null; call++) {
            const result = await find(storage, { after: cursor });
            found = found.concat(result.records.map(r => r.id));
            cursor = result.cursor;
        }

        expect(found).toEqual([`rec-${beyond}`]);
        expect(cursor).toBeNull();
    });

    it("reports a null cursor only when the data actually ran out", async () => {
        const { storage, execute } = subject({ total: 3 });

        const result = await find(storage);

        expect(result.cursor).toBeNull();
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("does not claim the end just because it filled the batch", async () => {
        // A full batch is the caller getting what it asked for. Calling that the end would leave
        // everything after it unswept until the next run started over.
        const { storage } = subject({ isStale: () => true });

        const result = await find(storage, { limit: 10 });

        expect(result.records).toHaveLength(10);
        expect(result.cursor).not.toBeNull();
    });

    it("resumes mid-page rather than skipping the rest of it", async () => {
        // The batch fills partway through the first page. Resuming at the end of that page instead
        // of at the record it stopped on would silently drop everything in between.
        const { storage } = subject({ isStale: () => true });

        const first = await find(storage, { limit: 10 });
        const second = await find(storage, { limit: 10, after: first.cursor });

        expect(first.records.map(r => r.id)).toEqual(
            Array.from({ length: 10 }, (_, i) => `rec-${i}`)
        );
        expect(second.records.map(r => r.id)).toEqual(
            Array.from({ length: 10 }, (_, i) => `rec-${10 + i}`)
        );
    });
});
