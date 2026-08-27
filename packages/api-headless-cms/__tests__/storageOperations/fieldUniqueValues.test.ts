import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    createPersonEntries,
    createPersonModel,
    deletePersonModel
} from "~tests/storageOperations/helpers";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import type { Container } from "@webiny/di";
import { GetUniqueFieldValuesStorageOperation } from "~/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";

describe("field unique values listing", () => {
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

    it("should return unique values for a name field", async () => {
        const personModel = createPersonModel();
        const amount = 17;
        const results = await createPersonEntries({
            amount,
            container,
            maxRevisions: 0
        });
        const moreResults = await createPersonEntries({
            amount,
            container,
            maxRevisions: 0
        });
        const evenMoreResults = await createPersonEntries({
            amount,
            container,
            maxRevisions: 0
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

        const getUniqueFieldValues = container.resolve(GetUniqueFieldValuesStorageOperation);
        const values = (
            await getUniqueFieldValues.execute(personModel, {
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
