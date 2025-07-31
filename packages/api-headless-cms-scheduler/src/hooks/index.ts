import type { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/types.js";
import type { ScheduleContext } from "~/types.js";

export interface IAttachLifecycleHookParams {
    cms: ScheduleContext["cms"];
    schedulerModel: Pick<CmsModel, "modelId">;
}

export const attachLifecycleHooks = (params: IAttachLifecycleHookParams): void => {
    const { cms, schedulerModel } = params;

    const shouldContinue = (model: Pick<CmsModel, "modelId" | "isPrivate">): boolean => {
        if (model.modelId === schedulerModel.modelId) {
            return false;
        }
        // TODO maybe change with a list of private models which are allowed?
        else if (model.isPrivate) {
            return false;
        }

        return true;
    };

    const cancel = async (model: CmsModel, target: Pick<CmsEntry, "id">): Promise<void> => {
        if (shouldContinue(model) === false) {
            return;
        }
        const scheduler = cms.scheduler(model);

        const entry = await scheduler.getScheduled(target.id);
        if (!entry) {
            return;
        }
        try {
            await scheduler.cancel(entry.id);
        } catch {
            // does not matter
        }
    };

    cms.onEntryAfterPublish.subscribe(async ({ entry, model }) => {
        return cancel(model, entry);
    });
    cms.onEntryAfterUnpublish.subscribe(async ({ entry, model }) => {
        return cancel(model, entry);
    });
    cms.onEntryAfterDelete.subscribe(async ({ entry, model }) => {
        return cancel(model, entry);
    });
};
