import { createAbstraction } from "@webiny/feature/admin";
import type {
    CreateExperimentInput,
    ExperimentDto,
    UpdateExperimentInput,
    VariantDto
} from "./types.js";

export interface IExperimentsGateway {
    listExperiments(pageEntryId: string): Promise<ExperimentDto[]>;
    getExperiment(id: string): Promise<ExperimentDto | null>;
    listVariants(experimentId: string): Promise<VariantDto[]>;
    createExperiment(input: CreateExperimentInput): Promise<ExperimentDto>;
    updateExperiment(id: string, input: UpdateExperimentInput): Promise<ExperimentDto>;
    startExperiment(id: string): Promise<ExperimentDto>;
    stopExperiment(id: string): Promise<ExperimentDto>;
    deleteExperiment(id: string): Promise<boolean>;
    createVariant(input: { experimentId: string; name: string }): Promise<VariantDto>;
    updateVariant(id: string, input: { name?: string; status?: string }): Promise<VariantDto>;
    deleteVariant(id: string): Promise<boolean>;
}

export const ExperimentsGateway = createAbstraction<IExperimentsGateway>(
    "WebsiteBuilder/ExperimentsGateway"
);

export namespace ExperimentsGateway {
    export type Interface = IExperimentsGateway;
}
