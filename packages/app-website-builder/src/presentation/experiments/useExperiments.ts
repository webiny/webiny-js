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

    /**
     * Activate an experiment. Only one experiment can run on a page at a time, so any other running
     * experiment (from the same page) is stopped first.
     */
    const activateExperiment = async (
        experimentId: string,
        experiments: ExperimentDto[]
    ): Promise<ExperimentDto> => {
        const active = experiments.find(
            experiment => experiment.status === "running" && experiment.id !== experimentId
        );
        if (active) {
            await gateway.stopExperiment(active.id);
        }
        return gateway.startExperiment(experimentId);
    };

    const deactivateExperiment = (experimentId: string): Promise<ExperimentDto> =>
        gateway.stopExperiment(experimentId);

    /** Delete an experiment along with its variants. */
    const deleteExperiment = async (experimentId: string): Promise<boolean> => {
        const variants = await gateway.listVariants(experimentId).catch(() => []);
        for (const variant of variants) {
            await gateway.deleteVariant(variant.id).catch(() => undefined);
        }
        return gateway.deleteExperiment(experimentId);
    };

    return {
        gateway,
        listExperiments,
        createExperiment,
        activateExperiment,
        deactivateExperiment,
        deleteExperiment
    };
};
