import { createAbstraction } from "@webiny/feature/admin";
import type {
    ExperimentCreateInput,
    ExperimentDto,
    ExperimentUpdateInput,
    VariantCreateInput,
    VariantDto,
    VariantUpdateInput
} from "./types.js";

/**
 * Admin-side gateway for the A/B testing GraphQL API. One cohesive gateway covers the whole
 * experiment + variant lifecycle, mirroring the API's experiments schema.
 */
export interface IExperimentsGateway {
    listExperiments(pageEntryId: string): Promise<ExperimentDto[]>;
    getExperiment(id: string): Promise<ExperimentDto | null>;
    getActiveExperiment(revisionId: string): Promise<ExperimentDto | null>;
    createExperiment(input: ExperimentCreateInput): Promise<ExperimentDto>;
    updateExperiment(id: string, input: ExperimentUpdateInput): Promise<ExperimentDto>;
    startExperiment(id: string): Promise<ExperimentDto>;
    stopExperiment(id: string): Promise<ExperimentDto>;
    pauseExperiment(experimentEntryId: string): Promise<boolean>;
    resumeExperiment(experimentEntryId: string): Promise<boolean>;
    isExperimentPaused(experimentEntryId: string): Promise<boolean>;
    graduateVariant(experimentId: string, variantId: string): Promise<{ id: string }>;

    listVariants(experimentId: string): Promise<VariantDto[]>;
    getVariant(id: string): Promise<VariantDto | null>;
    createVariant(input: VariantCreateInput): Promise<VariantDto>;
    updateVariant(id: string, input: VariantUpdateInput): Promise<VariantDto>;
    deleteVariant(id: string): Promise<boolean>;
}

export const ExperimentsGateway = createAbstraction<IExperimentsGateway>(
    "WebsiteBuilder/ExperimentsGateway"
);

export namespace ExperimentsGateway {
    export type Interface = IExperimentsGateway;
}
