import { useFeature } from "@webiny/app";
import { ExperimentsFeature } from "~/features/experiments/feature.js";

/**
 * React access to the A/B testing gateway. UI components (experiment panels, variant lists,
 * start/stop/graduate actions) consume this to drive the experiments admin surface.
 */
export const useExperiments = () => {
    const { gateway } = useFeature(ExperimentsFeature);
    return gateway;
};
