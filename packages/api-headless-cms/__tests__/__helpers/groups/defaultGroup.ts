import { type CmsGroup, createModelGroupPlugin } from "~/index.js";

export const createDefaultGroup = (input?: Partial<CmsGroup>) => {
    return createModelGroupPlugin({
        id: "webinyDefaultGroup",
        name: "Webiny Default Group",
        description: "Default group for all models.",
        icon: "fa/fas",
        slug: "webiny-default-group",
        ...input
    });
};
