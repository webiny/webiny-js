import {
    createPersonEntries,
    createPersonModel,
    deletePersonModel,
    PersonEntriesResult
} from "./helpers";
import { useAdminGqlHandler } from "../utils/useAdminGqlHandler";
import { CmsModel, HeadlessCmsStorageOperations } from "~/types";

jest.setTimeout(60000);

interface WaitPersonRecordsParams {
    records: PersonEntriesResult;
    storageOperations: HeadlessCmsStorageOperations;
    name: string;
    until: Function;
    model: CmsModel;
}
const waitPersonRecords = async (params: WaitPersonRecordsParams): Promise<void> => {
    const { records, storageOperations, until, model, name } = params;
    await until(
        () => {
            return storageOperations.entries.list(model, {
                where: {
                    latest: true
                },
                sort: ["version_ASC"],
                limit: 10000
            });
        },
        ({ items }: any) => {
            /**
             * There must be item for each result last revision id.
             */
            return Object.values(records).every(record => {
                return items.some((item: any) => item.id === record.last.id);
            });
        },
        {
            name
        }
    );
};

describe("Entries storage operations", () => {
    const { storageOperations, until } = useAdminGqlHandler({
        path: "manage/en-US"
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
        const amount = 102;
        const results = await createPersonEntries({
            amount,
            storageOperations,
            maxRevisions: 3
        });
        /**
         * We run a check that results have last entry as the amount of revisions.
         */
        for (const entryId in results) {
            const result = results[entryId];

            expect(result.last.version).toEqual(result.revisions.length);
        }

        await waitPersonRecords({
            records: results,
            storageOperations,
            name: "list all person entries after create",
            until,
            model: personModel
        });

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

    it("getByIds - should get all entries by id list", async () => {
        const personModel = createPersonModel();
        const amount = 202;
        const results = await createPersonEntries({
            amount,
            storageOperations,
            maxRevisions: 1
        });

        await waitPersonRecords({
            records: results,
            storageOperations,
            name: "list all person entries after create",
            until,
            model: personModel
        });

        const items = Object.values(results);

        const records = await storageOperations.entries.getByIds(personModel, {
            ids: items.map(result => result.last.id)
        });

        expect(records).toHaveLength(items.length);
    });
});
