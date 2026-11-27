import { describe, expect, it } from "vitest";
import { createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import {
    CancelScheduledActionUseCase,
    ScheduleActionUseCase,
    ScheduledActionTypePublish,
    ScheduledActionTypeUnpublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { useHandler } from "./__mocks/context/useHandler.js";
import { createMockTargetModel, createMockTargetModelPlugins } from "./__mocks/targetModel.js";
import { createNamespace } from "~/utils/namespace.js";

const MODEL_ID = "taggedModel";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

const createContext = async (
    tags: string[],
    identity?: IdentityData,
    permissions?: SecurityPermission[]
): Promise<CmsContext> => {
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
    return useHandler({
        legacyPlugins: [createMockTargetModelPlugins(), plugin],
        identity,
        permissions
    }).handler();
};

const createEntry = async (context: CmsContext) => {
    const modelResult = await context.container.resolve(GetModelUseCase).execute(MODEL_ID);
    const model = modelResult.value as CmsModel;
    const entry = await context.container.resolve(CreateEntryUseCase).execute(model, {
        values: { title: "Entry" }
    });
    return { model, id: entry.value.id as string };
};

const schedule = (
    context: CmsContext,
    model: CmsModel,
    id: string,
    actionType: typeof ScheduledActionTypePublish | typeof ScheduledActionTypeUnpublish
) => {
    return context.container.resolve(ScheduleActionUseCase).execute({
        tenant: "root",
        namespace: createNamespace(model),
        targetId: id,
        actionType,
        scheduleFor: new Date(Date.now() + 100000)
    });
};

const actionTypes = [
    ["publish", ScheduledActionTypePublish],
    ["unpublish", ScheduledActionTypeUnpublish]
] as const;

describe.each(actionTypes)("Schedule %s through the scheduler", (_, actionType) => {
    it.each([
        ["an untagged singleton model", ["singleEntry"]],
        ["a regular model tagged $publishing:false", ["$publishing:false"]]
    ])("fails for %s", async (_name, tags) => {
        const context = await createContext(tags);
        const { model, id } = await createEntry(context);

        const result = await schedule(context, model, id, actionType);

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Model does not support publishing.");
    });

    it.each([
        ["a regular model", []],
        ["a singleton model tagged $publishing:true", ["singleEntry", "$publishing:true"]]
    ])("succeeds for %s", async (_name, tags) => {
        const context = await createContext(tags);
        const { model, id } = await createEntry(context);

        const result = await schedule(context, model, id, actionType);

        expect(result.isOk()).toBe(true);
    });
});

describe("Schedule a publishing singleton with own-entries access", () => {
    const ownEntries = [
        { _src: "role", name: "cms.endpoint.manage" },
        { _src: "role", name: "cms.contentModelGroup", rwd: "r" },
        { _src: "role", name: "cms.contentModel", rwd: "r" },
        { _src: "role", name: "cms.contentEntry", rwd: "rwd", pw: "pu", own: true }
    ] as unknown as SecurityPermission[];

    const tags = ["singleEntry", "$publishing:true"];

    it.each(actionTypes)("allows %s of an entry created by another identity", async (_, type) => {
        const contextA = await createContext(tags, identityA);
        const { model, id } = await createEntry(contextA);

        const contextB = await createContext(tags, identityB, ownEntries);
        const result = await schedule(contextB, model, id, type);

        expect(result.isOk()).toBe(true);
    });
});

describe("Cancel a schedule on a model without publishing", () => {
    it("cancels a schedule created while the model still supported publishing", async () => {
        const publishing = await createContext(["singleEntry", "$publishing:true"]);
        const { model, id } = await createEntry(publishing);
        const scheduled = await schedule(publishing, model, id, ScheduledActionTypePublish);
        expect(scheduled.isOk()).toBe(true);

        const untagged = await createContext(["singleEntry"]);
        const refused = await schedule(untagged, model, id, ScheduledActionTypePublish);
        expect(refused.isFail()).toBe(true);

        const cancelled = await untagged.container.resolve(CancelScheduledActionUseCase).execute({
            id: scheduled.value.id,
            namespace: scheduled.value.namespace,
            tenant: "root"
        });
        expect(cancelled.isOk()).toBe(true);
    });
});
