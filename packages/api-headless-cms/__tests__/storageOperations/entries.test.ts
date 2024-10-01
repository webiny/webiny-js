import { createPersonEntries, createPersonModel, deletePersonModel } from "./helpers";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsContext } from "~/types";

jest.setTimeout(90000);

describe("Entries storage operations", () => {
    const { storageOperations, plugins } = useGraphQLHandler({
        path: "manage/en-US"
    });

    /**
     * We must load CMS GraphQL field plugins for the storage operations to work.
     * This is specifically for DDB and DDB+ES storage operations.
     * Some others might not need them...
     */
    beforeAll(async () => {
        await storageOperations.beforeInit({
            plugins
        } as unknown as CmsContext);
    });

    beforeEach(async () => {
        await deletePersonModel({
            storageOperations
        });
    });

    afterEach(async () => {
        await deletePersonModel({
            storageOperations
        });
    });

    it("getRevisions - should get revisions of all the entries", async () => {
        const personModel = createPersonModel();
        const amount = 45;
        const results = await createPersonEntries({
            amount,
            storageOperations,
            maxRevisions: 3,
            plugins
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
            const resultRevisions = await storageOperations.entries.getRevisions(personModel, {
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
            storageOperations,
            maxRevisions: 1,
            plugins
        });

        const result = await storageOperations.entries.list(personModel, {
            where: {
                name_contains: "person ",
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
            storageOperations,
            maxRevisions: 1,
            plugins
        });

        const items = Object.values(results);

        const records = await storageOperations.entries.getByIds(personModel, {
            ids: items.map(result => result.last.id)
        });

        expect(records).toHaveLength(items.length);
    });
});
