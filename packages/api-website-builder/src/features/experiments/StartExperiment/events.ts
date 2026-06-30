import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { ExperimentAfterStartEventHandler } from "./abstractions.js";
import type { ExperimentAfterStartPayload } from "./abstractions.js";

export class ExperimentAfterStartEvent extends DomainEvent<ExperimentAfterStartPayload> {
    eventType = "experiment.afterStart" as const;

    getHandlerAbstraction() {
        return ExperimentAfterStartEventHandler;
    }
}
