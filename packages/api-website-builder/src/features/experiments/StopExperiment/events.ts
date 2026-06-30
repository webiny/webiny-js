import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { ExperimentAfterStopEventHandler } from "./abstractions.js";
import type { ExperimentAfterStopPayload } from "./abstractions.js";

export class ExperimentAfterStopEvent extends DomainEvent<ExperimentAfterStopPayload> {
    eventType = "experiment.afterStop" as const;

    getHandlerAbstraction() {
        return ExperimentAfterStopEventHandler;
    }
}
