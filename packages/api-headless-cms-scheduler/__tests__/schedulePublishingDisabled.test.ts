import { describe, expect, it } from "vitest";
import { createModelPlugin } from "@webiny/api-headless-cms";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import {
    SchedulePublishEntryUseCase,
    ScheduleUnpublishEntryUseCase
} from "~/exports/api/cms/scheduler.js";
import { useHandler } from "./__mocks/context/useHandler.js";
import { createMockTargetModel, createMockTargetModelPlugins } from "./__mocks/targetModel.js";

const MODEL_ID = "taggedModel";

const setup = async (tags: string[]) => {
    const { singularApiName, pluralApiName, ...model } = createMockTargetModel();
    const isSingleEntry = tags.includes("singleEntry");
    const plugin = createModelPlugin({
        ...model,
        modelId: MODEL_ID,
        name: "Tagged Model",
        singularApiName: "taggedModel",
        pluralApiName: isSingleEntry ? "taggedModelUnused" : "taggedModels",
        tags
    } as any);
    const { container } = await useHandler({
        legacyPlugins: [createMockTargetModelPlugins(), plugin]
    }).handler();
    const modelResult = await container.resolve(GetModelUseCase).execute(MODEL_ID);
    const cmsModel = modelResult.value;
    const entry = await container.resolve(CreateEntryUseCase).execute(cmsModel, {
        values: { title: "Entry" }
    });
    return { container, model: cmsModel, id: entry.value.id as string };
};

const useCases = [
    ["publish", SchedulePublishEntryUseCase],
    ["unpublish", ScheduleUnpublishEntryUseCase]
] as const;

describe.each(useCases)("Schedule %s on models without publishing", (_, UseCase) => {
    it.each([
        ["an untagged singleton model", ["singleEntry"]],
        ["a regular model tagged $publishing:false", ["$publishing:false"]]
    ])("fails for %s", async (_name, tags) => {
        const { container, model, id } = await setup(tags);

        const result = await container.resolve(UseCase).execute({
            id,
            model,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Model does not support publishing.");
    });

    it.each([
        ["a regular model", []],
        ["a singleton model tagged $publishing:true", ["singleEntry", "$publishing:true"]]
    ])("succeeds for %s", async (_name, tags) => {
        const { container, model, id } = await setup(tags);

        const result = await container.resolve(UseCase).execute({
            id,
            model,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });

        expect(result.isOk()).toBe(true);
    });
});
