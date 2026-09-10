import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";

export interface ExperimentAfterStopPayload {
    experiment: WbExperiment;
    /** Why the experiment was stopped: an explicit user action, or a cascade from publishing. */
    reason: "manual" | "revisionPublished";
}

/** Hook into experiment lifecycle after an experiment is stopped. */
export const ExperimentAfterStopEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentAfterStopPayload>>
>("Wb/ExperimentAfterStopEventHandler");

export namespace ExperimentAfterStopEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentAfterStopPayload>>;
    export type Event = DomainEvent<ExperimentAfterStopPayload>;
}
