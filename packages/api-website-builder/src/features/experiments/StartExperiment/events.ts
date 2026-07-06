import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { ExperimentAfterStartEventHandler } from "./abstractions/ExperimentAfterStartEventHandler.js";
import type { ExperimentAfterStartPayload } from "./abstractions/ExperimentAfterStartEventHandler.js";

export class ExperimentAfterStartEvent extends DomainEvent<ExperimentAfterStartPayload> {
    eventType = "experiment.afterStart" as const;

    getHandlerAbstraction() {
        return ExperimentAfterStartEventHandler;
    }
}
