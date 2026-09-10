import { ExperimentsGateway } from "~/features/experiments/index.js";
import type { ExperimentDto, VariantDto } from "~/features/experiments/index.js";
import {
    ExperimentsEditorDataSource as Abstraction,
    type IExperimentsEditorDataSource
} from "./abstractions/ExperimentsEditorDataSource.js";

/**
 * Thin gateway-orchestration data source for the editor-embedded experiments UI: loads a page's
 * experiments, a single experiment's variants, and the runtime kill-switch state.
 */
class ExperimentsEditorDataSourceImpl implements IExperimentsEditorDataSource {
    constructor(private readonly gateway: ExperimentsGateway.Interface) {}

    async listExperiments(pageEntryId: string): Promise<ExperimentDto[]> {
        return this.gateway.listExperiments(pageEntryId).catch(() => [] as ExperimentDto[]);
    }

    async listVariants(experimentId: string): Promise<VariantDto[]> {
        return this.gateway.listVariants(experimentId).catch(() => [] as VariantDto[]);
    }

    async getExperimentPaused(experimentEntryId: string): Promise<boolean> {
        return this.gateway.getExperimentPaused(experimentEntryId).catch(() => false);
    }
}

export const ExperimentsEditorDataSource = Abstraction.createImplementation({
    implementation: ExperimentsEditorDataSourceImpl,
    dependencies: [ExperimentsGateway]
});
