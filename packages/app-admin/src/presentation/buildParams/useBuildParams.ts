import { useFeature } from "@webiny/app";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";

export const useBuildParams = () => {
    return useFeature(BuildParamsFeature);
};
