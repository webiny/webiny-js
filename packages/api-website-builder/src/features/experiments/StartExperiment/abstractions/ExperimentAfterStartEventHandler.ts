import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";

export interface ExperimentAfterStartPayload {
    experiment: WbExperiment;
}

/** Hook into experiment lifecycle after an experiment is started. */
export const ExperimentAfterStartEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentAfterStartPayload>>
>("Wb/ExperimentAfterStartEventHandler");

export namespace ExperimentAfterStartEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentAfterStartPayload>>;
    export type Event = DomainEvent<ExperimentAfterStartPayload>;
}
