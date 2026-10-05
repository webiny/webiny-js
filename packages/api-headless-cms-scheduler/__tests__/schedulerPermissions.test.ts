import { describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "./__mocks/targetModel.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CMS_NAMESPACE } from "~/utils/namespace.js";
import { SchedulePublishEntryUseCase } from "~/exports/api/cms/scheduler.js";

const createContext = (permissions: { name: string }[]) =>
    useHandler({
        permissions,
        plugins: [createHeadlessCmsScheduler(), createMockTargetModelPlugins()]
    }).handler();

const scheduleAnEntry = async () => {
    const { container } = await createContext([{ name: "*" }]);
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
    expect(scheduled.isOk()).toBe(true);
};

/*
 * Scheduler access follows the permissions of the app that owns an action's namespace. When no app
 * claims the namespace, or a caller lists without one, only full-access identities and code running
 * without authorization get through.
 */
describe("Scheduler permissions without an owning app", () => {
    it("lets a CMS user list the CMS namespace", async () => {
        await scheduleAnEntry();
        const { container } = await createContext([{ name: "cms.*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace_startsWith: CMS_NAMESPACE }
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toHaveLength(1);
    });

    it("doesn't let a CMS user list without a namespace", async () => {
        await scheduleAnEntry();
        const { container } = await createContext([{ name: "cms.*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({ where: {} });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("doesn't let a CMS user list a namespace no app claims", async () => {
        const { container } = await createContext([{ name: "cms.*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace: "Unknown/App" }
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("lets a full-access user list without a namespace", async () => {
        await scheduleAnEntry();
        const { container } = await createContext([{ name: "*" }]);

        const result = await container.resolve(ListScheduledActionsUseCase).execute({ where: {} });

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toHaveLength(1);
    });

    it("lets code running without authorization list without a namespace", async () => {
        await scheduleAnEntry();
        const { container } = await createContext([{ name: "cms.*" }]);

        const result = await container
            .resolve(IdentityContext)
            .withoutAuthorization(() =>
                container.resolve(ListScheduledActionsUseCase).execute({ where: {} })
            );

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toHaveLength(1);
    });
});
