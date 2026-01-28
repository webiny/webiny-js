import { useModel, usePermission } from "@webiny/app-headless-cms";

export const HideCompanyPublishActions = usePermission.createDecorator(baseHook => {
    return () => {
        const { model } = useModel();
        const hook = baseHook();

        if (model.modelId === "company") {
            return {
                ...hook,
                canPublish: () => {
                    return false;
                }
            };
        }

        return hook;
    };
});
