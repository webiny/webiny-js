import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPersonEntries, createPersonModel, deletePersonModel } from "./helpers";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import type { Container } from "@webiny/di";
import { ListEntriesStorageOperation } from "~/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { GetEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { GetRevisionsStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";

vi.setConfig({
    testTimeout: 100_000
});

describe("Entries storage operations", () => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    /**
     * Storage operations are created by a DI factory during context initialization.
     * We invoke a query to trigger context init, then capture the container.
     */
    beforeEach(async () => {
        await handler.isInstalledQuery();
        const context = handler.getContext();
        container = context.container;

        await deletePersonModel({
            container
        });
    });

    afterEach(async () => {
        await deletePersonModel({
            container
        });
    });

    it("getRevisions - should get revisions of all the entries", async () => {
        const personModel = createPersonModel();
        const amount = 45;
        const results = await createPersonEntries({
            amount,
            container,
            maxRevisions: 3
        });
        /**
         * We run a check that results have last entry as the amount of revisions.
         */
        for (const entryId in results) {
            const result = results[entryId];

            expect(result.last.version).toEqual(result.revisions.length);
        }

        /**
         * There must be "amount" of results.
         */
        expect(Object.values(results)).toHaveLength(amount);

        for (const entryId in results) {
            const first = results[entryId].first;
            const revisions = results[entryId].revisions;

            const revisionIdList: string[] = [];
            /**
             * We fetch revisions of each first entry.
             */
            const getRevisions = container.resolve(GetRevisionsStorageOperation);
            const resultRevisions = await getRevisions.execute(personModel, {
                id: first.id
            });
            /**
             * We must have exact amount of revisions as created.
             */
            expect(resultRevisions).toHaveLength(revisions.length);

            for (const rev of revisions) {
                const res = resultRevisions.filter(r => r.id === rev.id);
                /**
                 * Each revision must be loaded only once.
                 */
                expect(res).toHaveLength(1);
                /**
                 * And we cannot have same IDs in the revisions.
                 */
                expect(revisionIdList).not.toContain(rev.id);

                revisionIdList.push(rev.id);
            }
        }
    });

    it("should list all entries", async () => {
        const personModel = createPersonModel();
        const amount = 10;
        await createPersonEntries({
            amount,
            container,
            maxRevisions: 1
        });

        const listEntries = container.resolve(ListEntriesStorageOperation);
        const result = await listEntries.execute(personModel, {
            where: {
                values: {
                    name_contains: "person "
                },
                latest: true
            },
            limit: 1000
        });

        expect(result.items).toHaveLength(amount);
        expect(result).toMatchObject({
            cursor: expect.any(String),
            hasMoreItems: false,
            totalCount: amount
        });
    });

    it("getByIds - should get all entries by id list", async () => {
        const personModel = createPersonModel();
        const amount = 51;
        const results = await createPersonEntries({
            amount,
            container,
            maxRevisions: 1
        });

        const items = Object.values(results);

        const getEntriesByIds = container.resolve(GetEntriesByIdsStorageOperation);
        const records = await getEntriesByIds.execute(personModel, {
            ids: items.map(result => result.last.id)
        });

        expect(records).toHaveLength(items.length);
    });
});
