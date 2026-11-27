import { useMemo } from "react";
import { isPublishingEnabled } from "@webiny/app-headless-cms-common";
import { useModel } from "~/admin/components/ModelProvider/index.js";

export const useIsModelPublishable = () => {
    const { model } = useModel();

    return useMemo(() => isPublishingEnabled(model), [model]);
};
