import { useFeature } from "@webiny/app";
import { ExperimentsFeature } from "~/features/experiments/index.js";
import type { ExperimentDto } from "~/features/experiments/index.js";
import type { NewExperimentPayload } from "./NewExperimentForm.js";

export const useExperiments = () => {
    const { gateway } = useFeature(ExperimentsFeature);

    const listExperiments = (pageEntryId: string) => gateway.listExperiments(pageEntryId);

    /**
     * Persist a new experiment: create the experiment, then each variant (whose content the API
     * copies from the baseline) marked ready, then write the traffic split now that we have the
     * variant ids. The experiment key is carried in the analytics config.
     */
    const createExperiment = async (params: {
        pageEntryId: string;
        baselineRevisionId: string;
        payload: NewExperimentPayload;
    }): Promise<ExperimentDto> => {
        const { pageEntryId, baselineRevisionId, payload } = params;

        const experiment = await gateway.createExperiment({
            pageEntryId,
            baselineRevisionId,
            name: payload.name,
            targeting: { trafficPercentage: 100 },
            analytics: { provider: "posthog", experimentKey: payload.key },
            trafficSplit: { control: payload.control.weight, variants: {} }
        });

        const variantSplit: Record<string, number> = {};
        for (const variant of payload.variants) {
            const created = await gateway.createVariant({
                experimentId: experiment.id,
                name: variant.name
            });
            await gateway.updateVariant(created.id, { status: "ready" });
            variantSplit[created.entryId] = variant.weight;
        }

        return gateway.updateExperiment(experiment.id, {
            trafficSplit: { control: payload.control.weight, variants: variantSplit }
        });
    };

    return { gateway, listExperiments, createExperiment };
};
