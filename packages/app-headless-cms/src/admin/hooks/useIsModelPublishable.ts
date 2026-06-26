import { useMemo } from "react";
import { useModel } from "~/admin/components/ModelProvider/index.js";

export const useIsModelPublishable = () => {
    const { model } = useModel();

    return useMemo(() => !model.tags.includes("$publishing:false"), [model]);
};
