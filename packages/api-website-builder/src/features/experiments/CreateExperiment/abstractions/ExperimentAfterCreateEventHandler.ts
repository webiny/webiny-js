import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";

export interface ExperimentAfterCreatePayload {
    experiment: WbExperiment;
}

/** Hook into experiment lifecycle after an experiment is created. */
export const ExperimentAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentAfterCreatePayload>>
>("Wb/ExperimentAfterCreateEventHandler");

export namespace ExperimentAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentAfterCreatePayload>>;
    export type Event = DomainEvent<ExperimentAfterCreatePayload>;
}
