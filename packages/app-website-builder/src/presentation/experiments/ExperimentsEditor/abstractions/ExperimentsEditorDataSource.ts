import { createAbstraction } from "@webiny/feature/admin";
import type { ExperimentDto, VariantDto } from "~/features/experiments/index.js";

export interface IExperimentsEditorDataSource {
    // Load all experiments for a page (by its entry id).
    listExperiments(pageEntryId: string): Promise<ExperimentDto[]>;
    // Load the variants of a single experiment.
    listVariants(experimentId: string): Promise<VariantDto[]>;
    // Read the runtime kill-switch state for an experiment (keyed on its entryId).
    getExperimentPaused(experimentEntryId: string): Promise<boolean>;
}

export const ExperimentsEditorDataSource = createAbstraction<IExperimentsEditorDataSource>(
    "WebsiteBuilder/ExperimentsEditor/DataSource"
);

export namespace ExperimentsEditorDataSource {
    export type Interface = IExperimentsEditorDataSource;
}
