import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createSchedulerModel } from "~/scheduler/model.js";

export const createMockSchedulerModel = (input?: Partial<CmsModel>): CmsModel => {
    const model = createSchedulerModel();
    return {
        ...model.contentModel,
        webinyVersion: "0.0.0",
        tenant: "root",
        locale: "en-US",
        ...input
    };
};
