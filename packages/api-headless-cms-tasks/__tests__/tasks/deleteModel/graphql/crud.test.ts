import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";
import { createStoreKey } from "~/helpers/store.js";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";
import { HeadlessCms } from "@webiny/api-headless-cms/features/shared/abstractions.js";

describe("headless cms tasks crud", () => {
    it("should list models being deleted", async () => {
        const { handler, identity, tenant } = useHandler();
        const context = await handler();

        const results = await context.container
            .resolve(DeleteModelOperations)
            .listModelsBeingDeleted();
        expect(results).toHaveLength(0);

        const value: IStoreValue = {
            modelId: "modelId",
            task: "task",
            identity,
            tenant: tenant.id
        };

        await context.db.store.storeValue(createStoreKey(value), value);

        const secondaryContext = await handler();

        const resultsPopulated = await secondaryContext.container
            .resolve(DeleteModelOperations)
            .listModelsBeingDeleted();
        expect(resultsPopulated).toHaveLength(1);
        expect(resultsPopulated).toEqual([value]);

        await context.db.store.removeValue(createStoreKey(value));

        const tertiaryContext = await handler();

        const resultsRemoved = await tertiaryContext.container
            .resolve(DeleteModelOperations)
            .listModelsBeingDeleted();
        expect(resultsRemoved).toHaveLength(0);
    });

    it("should start delete of the model", async () => {
        const { handler, identity, tenant } = useHandler();
        const context = await handler();

        const group = await context.container.resolve(HeadlessCms).createGroup({
            name: "group",
            description: "description",
            id: "group",
            icon: {
                type: "icon",
                name: "icon",
                value: "icon"
            }
        });

        const model = await context.container.resolve(HeadlessCms).createModel({
            modelId: "modelId",
            description: "description",
            name: "name",
            fields: [],
            layout: [],
            singularApiName: "SingularApiName",
            pluralApiName: "PluralApiName",
            group: group.id
        });

        const secondaryContext = await handler();
        const tertiaryContext = await handler();

        const fullyDeleteResult = await context.container
            .resolve(DeleteModelOperations)
            .fullyDeleteModel(model.modelId);
        expect(fullyDeleteResult).toEqual({
            total: 0,
            deleted: 0,
            status: "running",
            id: expect.any(String)
        });
        const value: IStoreValue = {
            modelId: model.modelId,
            task: fullyDeleteResult.id,
            identity,
            tenant: tenant.id
        };

        const results = await context.container
            .resolve(DeleteModelOperations)
            .listModelsBeingDeleted();
        expect(results).toHaveLength(1);
        expect(results).toEqual([
            {
                ...value,
                task: fullyDeleteResult.id
            }
        ]);

        const cancelDeleteResult = await secondaryContext.container
            .resolve(DeleteModelOperations)
            .cancelFullyDeleteModel(model.modelId);

        expect(cancelDeleteResult).toEqual({
            total: 0,
            deleted: 0,
            status: "canceled",
            id: expect.any(String)
        });

        const resultsCanceled = await tertiaryContext.container
            .resolve(DeleteModelOperations)
            .listModelsBeingDeleted();
        expect(resultsCanceled).toHaveLength(0);
    });
});
