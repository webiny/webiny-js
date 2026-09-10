import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ICreateExperimentParams } from "./CreateExperimentUseCase.js";

export interface ExperimentBeforeCreatePayload {
    input: ICreateExperimentParams;
}

/** Hook into experiment lifecycle before an experiment is created. */
export const ExperimentBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentBeforeCreatePayload>>
>("Wb/ExperimentBeforeCreateEventHandler");

export namespace ExperimentBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentBeforeCreatePayload>>;
    export type Event = DomainEvent<ExperimentBeforeCreatePayload>;
}
