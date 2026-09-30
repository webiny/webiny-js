import type { Container } from "@webiny/di";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "~/types";
import { createPersonModel } from "../helpers";
import { createTestEntry } from "../entryFixtures";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";

export const MODEL_X = "isolationModelX";
export const MODEL_Y = "isolationModelY";

export const ENTRY_X = "entryinmodelx";
export const ENTRY_Y = "entryinmodely";

export const createModel = (modelId: string): CmsModel => {
    return {
        ...createPersonModel(),
        modelId,
        name: modelId,
        group: "isolationGroup",
        icon: null
    };
};

export const modelX = createModel(MODEL_X);
export const modelY = createModel(MODEL_Y);

export const createRevisionId = (entryId: string): string => {
    return createIdentifier({ id: entryId, version: 1 });
};

export const createModelEntry = (model: CmsModel, entryId: string): CmsEntry => {
    return createTestEntry({
        model,
        entryId,
        version: 1,
        status: "published",
        values: { name: `${model.modelId} entry` }
    });
};

/**
 * One published entry in each model, same tenant, different entry ids.
 */
export const createEntryInBothModels = async (container: Container): Promise<void> => {
    const createEntry = container.resolve(CreateEntryStorageOperation);
    const publishEntry = container.resolve(PublishEntryStorageOperation);

    for (const [model, entryId] of [
        [modelX, ENTRY_X],
        [modelY, ENTRY_Y]
    ] as const) {
        const draft = { ...createModelEntry(model, entryId), status: "draft" as const };
        await createEntry.execute(model, { entry: draft, storageEntry: draft });
        const published = createModelEntry(model, entryId);
        await publishEntry.execute(model, { entry: published, storageEntry: published });
    }
};
