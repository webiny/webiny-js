import { useModel } from "@webiny/app-headless-cms-common";
import { useMemo } from "react";

export const useIsModelPublishable = () => {
    const { model } = useModel();

    return useMemo(() => !model.tags.includes("$publishing:false"), [model]);
};
