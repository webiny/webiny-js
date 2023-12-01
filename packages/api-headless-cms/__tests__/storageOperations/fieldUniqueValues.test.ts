import { CmsContext } from "~/types";
import {
    createPersonEntries,
    createPersonModel,
    deletePersonModel
} from "~tests/storageOperations/helpers";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";

describe("field unique values listing", () => {
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

    it("should return unique values for a name field", async () => {
        const personModel = createPersonModel();
        const amount = 17;
        const results = await createPersonEntries({
            amount,
            storageOperations,
            maxRevisions: 0,
            plugins
        });
        const moreResults = await createPersonEntries({
            amount,
            storageOperations,
            maxRevisions: 0,
            plugins
        });
        const evenMoreResults = await createPersonEntries({
            amount,
            storageOperations,
            maxRevisions: 0,
            plugins
        });
        for (const entryId in moreResults) {
            results[entryId] = moreResults[entryId];
        }
        for (const entryId in evenMoreResults) {
            results[entryId] = evenMoreResults[entryId];
        }

        /**
         * There must be "amount" * 3 of results.
         */
        expect(Object.values(results)).toHaveLength(amount * 3);

        const values = (
            await storageOperations.entries.getUniqueFieldValues(personModel, {
                where: {
                    latest: true
                },
                fieldId: "name"
            })
        ).sort((a, b) => {
            const p1 = Number(a.value.split("#")[1]);
            const p2 = Number(b.value.split("#")[1]);
            return p1 < p2 ? -1 : 1;
        });

        /**
         * There should be the "amount" of unique values.
         */
        expect(values).toEqual(
            Array.from({ length: 17 })
                .map((_, index) => {
                    return {
                        value: `Person #${index + 1}`,
                        count: 3
                    };
                })
                .sort()
        );
    });
});
