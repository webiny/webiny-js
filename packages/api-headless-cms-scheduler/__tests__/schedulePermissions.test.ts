import { describe, expect, it } from "vitest";
import { createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase,
    ScheduleActionUseCase,
    ScheduledActionTypePublish,
    ScheduledActionTypeUnpublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { PermissionsArg } from "./__mocks/context/helpers.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import {
    createMockTargetModel,
    createMockTargetModelPlugins,
    MOCK_TARGET_MODEL_ID
} from "./__mocks/targetModel.js";
import { createNamespace } from "~/utils/namespace.js";

const PRIVATE_MODEL_ID = "privateTargetModel";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

const createPrivateModelPlugin = () => {
    const { singularApiName, pluralApiName, ...model } = createMockTargetModel();
    return createModelPlugin({
        ...model,
        modelId: PRIVATE_MODEL_ID,
        name: "Private Target Model",
        isPrivate: true
    } as any);
};

/**
 * CMS permissions for one role. All entries share `_src`, which is how the CMS joins
 * group, model and entry permissions together.
 */
const cmsPermissions = (entries: { rwd: string; pw?: string; own?: boolean }) => {
    return [
        { _src: "role", name: "cms.endpoint.manage" },
        { _src: "role", name: "cms.contentModelGroup", rwd: "r" },
        { _src: "role", name: "cms.contentModel", rwd: "r" },
        { _src: "role", name: "cms.contentEntry", ...entries }
    ] as unknown as PermissionsArg[];
};

const createContext = async (
    identity: IdentityData,
    permissions?: PermissionsArg[]
): Promise<CmsContext> => {
    const contextHandler = useHandler({
        plugins: [
            createHeadlessCmsScheduler(),
            createMockTargetModelPlugins(),
            createPrivateModelPlugin()
        ],
        identity,
        permissions
    });
    return contextHandler.handler();
};

const createEntry = async (context: CmsContext, modelId: string) => {
    const model = (await context.container.resolve(GetModelUseCase).execute(modelId))
        .value as CmsModel;
    const result = await context.container.resolve(CreateEntryUseCase).execute(model, {
        values: { title: "Entry of A" }
    });
    expect(result.isOk()).toBe(true);
    return { model, entry: result.value };
};

const schedule = (
    context: CmsContext,
    model: Pick<CmsModel, "modelId">,
    targetId: string,
    actionType:
        | typeof ScheduledActionTypePublish
        | typeof ScheduledActionTypeUnpublish = ScheduledActionTypePublish
) => {
    return context.container.resolve(ScheduleActionUseCase).execute({
        tenant: "root",
        namespace: createNamespace(model),
        targetId,
        actionType,
        scheduleFor: new Date(Date.now() + 100000)
    });
};

describe("Scheduling permissions", () => {
    it.each([
        ["publish with read-only access", cmsPermissions({ rwd: "r" }), ScheduledActionTypePublish],
        [
            "unpublish with read-only access",
            cmsPermissions({ rwd: "r" }),
            ScheduledActionTypeUnpublish
        ],
        [
            "unpublish with publish-only access",
            cmsPermissions({ rwd: "r", pw: "p" }),
            ScheduledActionTypeUnpublish
        ]
    ] as const)("should refuse to %s", async (_, permissions, actionType) => {
        const contextA = await createContext(identityA);
        const { model, entry } = await createEntry(contextA, MOCK_TARGET_MODEL_ID);

        const contextB = await createContext(identityB, permissions);
        const result = await schedule(contextB, model, entry.id, actionType);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("should refuse to schedule publishing of another user's entry with own-entries access", async () => {
        const contextA = await createContext(identityA);
        const { model, entry } = await createEntry(contextA, MOCK_TARGET_MODEL_ID);

        const contextB = await createContext(
            identityB,
            cmsPermissions({ rwd: "rwd", pw: "pu", own: true })
        );
        const result = await schedule(contextB, model, entry.id);

        expect(result.isFail()).toBe(true);
    });

    it("should allow scheduling with publish access", async () => {
        const contextA = await createContext(identityA);
        const { model, entry } = await createEntry(contextA, MOCK_TARGET_MODEL_ID);

        const contextB = await createContext(identityB, cmsPermissions({ rwd: "r", pw: "pu" }));
        const publish = await schedule(contextB, model, entry.id, ScheduledActionTypePublish);
        const unpublish = await schedule(contextB, model, entry.id, ScheduledActionTypeUnpublish);

        expect(publish.isOk()).toBe(true);
        expect(unpublish.isOk()).toBe(true);
    });

    it("should refuse to schedule entries of private models", async () => {
        const contextA = await createContext(identityA);
        const { model, entry } = await createEntry(contextA, PRIVATE_MODEL_ID);

        const result = await schedule(contextA, model, entry.id);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });
});

describe("Cancelling permissions", () => {
    it("should refuse to cancel with read-only access, and allow with publish access", async () => {
        const contextA = await createContext(identityA);
        const { model, entry } = await createEntry(contextA, MOCK_TARGET_MODEL_ID);
        const scheduled = await schedule(contextA, model, entry.id);
        expect(scheduled.isOk()).toBe(true);
        const action = { id: scheduled.value.id, namespace: scheduled.value.namespace };

        const readOnly = await createContext(identityB, cmsPermissions({ rwd: "r" }));
        const refused = await readOnly.container
            .resolve(CancelScheduledActionUseCase)
            .execute({ ...action, tenant: "root" });
        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).toBe("Scheduler/NotAuthorized");

        const publisher = await createContext(identityB, cmsPermissions({ rwd: "r", pw: "pu" }));
        const allowed = await publisher.container
            .resolve(CancelScheduledActionUseCase)
            .execute({ ...action, tenant: "root" });
        expect(allowed.isOk()).toBe(true);
    });

    it("should still remove schedules when their entry is deleted", async () => {
        const contextA = await createContext(identityA);
        const { model, entry } = await createEntry(contextA, MOCK_TARGET_MODEL_ID);
        const scheduled = await schedule(contextA, model, entry.id);
        expect(scheduled.isOk()).toBe(true);

        const before = await contextA.container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace: createNamespace(model) }
        });
        expect(before.value.items).toHaveLength(1);

        // B may delete A's entry but has no publish permission.
        const contextB = await createContext(identityB, cmsPermissions({ rwd: "rwd" }));
        const deleted = await contextB.container
            .resolve(DeleteEntryUseCase)
            .execute(model, entry.id, { permanently: true });
        expect(deleted.isOk()).toBe(true);

        const list = await contextA.container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace: createNamespace(model) }
        });
        expect(list.value.items).toHaveLength(0);
    });
});
