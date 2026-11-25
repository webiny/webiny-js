import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { SchedulerFeature, SchedulerService } from "@webiny/api-scheduler";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import {
    ScheduleActionUseCase,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { CmsSchedulerFeature } from "@webiny/api-headless-cms-scheduler";
import { createNamespace } from "@webiny/api-headless-cms-scheduler/utils/namespace.js";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityC: IdentityData = { id: "c", type: "admin", displayName: "C" };

const useHandlerWithScheduler = (params: Parameters<typeof useGraphQlHandler>[0]) => {
    const holder: { container: Container | undefined } = { container: undefined };
    const gql = useGraphQlHandler({
        ...params,
        plugins: [
            (container: Container) => {
                SchedulerFeature.register(container);
                CmsSchedulerFeature.register(container);
                container.registerInstance(SchedulerService, new VoidSchedulerService());
                holder.container = container;
            }
        ]
    });

    const schedule = async (model: CmsModel, targetId: string) => {
        // Any request creates the context.
        await gql.introspect();
        return holder.container!.resolve(ScheduleActionUseCase).execute({
            tenant: "root",
            namespace: createNamespace(model),
            targetId,
            actionType: ScheduledActionTypePublish,
            scheduleFor: new Date(Date.now() + 100000)
        });
    };

    return { gql, schedule };
};

describe("Scheduling an entry with folder level permissions", () => {
    it("should require write access to the folder of the entry", async () => {
        const { gql: gqlA } = useHandlerWithScheduler({ identity: identityA });
        const { schedule: scheduleC } = useHandlerWithScheduler({
            identity: identityC,
            permissions: [{ name: "cms.*" }]
        });

        const modelGroup = await gqlA.cms.createTestModelGroup();
        const model = await gqlA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folder = await gqlA.aco
            .createFolder({
                data: { title: "Folder A", slug: "folder-a", type: `cms:${model.modelId}` }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const createEntry = (folderId?: string) => {
            return gqlA.cms
                .createEntry(model, {
                    data: {
                        values: { title: "Test entry" },
                        ...(folderId ? { wbyAco_location: { folderId } } : {})
                    }
                })
                .then(([response]) => response.data.createBasicTestModel.data);
        };

        const entry = await createEntry(folder.id);
        const rootEntry = await createEntry();

        const setLevel = (level: string) => {
            return gqlA.aco.updateFolder({
                id: folder.id,
                data: { permissions: [{ target: `admin:${identityC.id}`, level }] }
            });
        };

        await setLevel("viewer");

        const denied = await scheduleC(model, entry.id);
        expect(denied.isFail()).toBe(true);
        expect(denied.error.code).toBe("Scheduler/NotAuthorized");

        await setLevel("editor");

        const allowed = await scheduleC(model, entry.id);
        expect(allowed.isOk()).toBe(true);

        // Entries in the root folder are not restricted.
        await setLevel("viewer");
        const rootAllowed = await scheduleC(model, rootEntry.id);
        expect(rootAllowed.isOk()).toBe(true);
    });
});
