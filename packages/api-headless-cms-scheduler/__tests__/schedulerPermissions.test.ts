import { describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "./__mocks/targetModel.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import {
    GetScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { CMS_NAMESPACE } from "~/utils/namespace.js";
import { SchedulePublishEntryUseCase } from "~/exports/api/cms/scheduler.js";

/*
 * There is no `scheduler.*` permission to grant in the admin, so a user with CMS permissions but
 * no full access (the usual role on a non-root tenant) has to be able to see what they scheduled.
 * Scheduler access follows the permissions of the app that owns the scheduled action.
 */
const setup = async (permissions: { name: string; [key: string]: unknown }[]) => {
    const context = await useHandler({
        permissions,
        legacyPlugins: [createMockTargetModelPlugins()]
    }).handler();
    const { container } = context;

    const model = (await container.resolve(GetModelUseCase).execute(MOCK_TARGET_MODEL_ID)).value;
    const entry = await container.resolve(CreateEntryUseCase).execute(model, {
        values: { title: "Scheduled entry" }
    });
    const scheduled = await container.resolve(SchedulePublishEntryUseCase).execute({
        id: entry.value.id,
        model,
        tenant: "root",
        scheduleFor: new Date(Date.now() + 100000)
    });

    return { container, scheduled };
};

describe("Scheduler permissions", () => {
    it("lets a user with CMS entry permissions see the actions they scheduled", async () => {
        const { container, scheduled } = await setup([{ name: "cms.*" }]);
        expect(scheduled.isOk()).toBe(true);

        const list = await container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace_startsWith: CMS_NAMESPACE }
        });
        expect(list.isOk()).toBe(true);
        expect(list.value.items).toHaveLength(1);

        const action = await container.resolve(GetScheduledActionUseCase).execute({
            id: scheduled.value.scheduledAction.id,
            namespace: scheduled.value.scheduledAction.namespace
        });
        expect(action.isOk()).toBe(true);
    });

    it("keeps a user without CMS entry permissions out of CMS scheduled actions", async () => {
        const { scheduled } = await setup([{ name: "cms.*" }]);
        expect(scheduled.isOk()).toBe(true);

        const { container } = await useHandler({
            permissions: [{ name: "fm.*" }],
            legacyPlugins: [createMockTargetModelPlugins()]
        }).handler();

        const action = await container.resolve(GetScheduledActionUseCase).execute({
            id: scheduled.value.scheduledAction.id,
            namespace: scheduled.value.scheduledAction.namespace
        });
        expect(action.isFail()).toBe(true);
        expect(action.error.code).toBe("Scheduler/NotAuthorized");
    });
});

/*
 * When no app claims an action's namespace, or a caller lists without one, there are no app
 * permissions to check against, so only full-access identities and code running without
 * authorization get through.
 */
describe("Scheduler permissions without an owning app", () => {
    const contextWith = (permissions: { name: string }[]) =>
        useHandler({
            permissions,
            legacyPlugins: [createMockTargetModelPlugins()]
        }).handler();

    it("doesn't let a CMS user list without a namespace", async () => {
        const { container } = await setup([{ name: "cms.*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({ where: {} });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("doesn't let a CMS user list a namespace no app claims", async () => {
        const { container } = await contextWith([{ name: "cms.*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace: "Unknown/App" }
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("lets a full-access user list without a namespace", async () => {
        const { container } = await setup([{ name: "*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({ where: {} });

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toHaveLength(1);
    });

    it("lets code running without authorization list without a namespace", async () => {
        const { container } = await setup([{ name: "cms.*" }]);

        const result = await container
            .resolve(IdentityContext)
            .withoutAuthorization(() =>
                container.resolve(ListScheduledActionsUseCase).execute({ where: {} })
            );

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toHaveLength(1);
    });
});
