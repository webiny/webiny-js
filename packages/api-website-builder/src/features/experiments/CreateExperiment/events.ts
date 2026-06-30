import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ExperimentBeforeCreateEventHandler,
    ExperimentAfterCreateEventHandler
} from "./abstractions.js";
import type {
    ExperimentBeforeCreatePayload,
    ExperimentAfterCreatePayload
} from "./abstractions.js";

export class ExperimentBeforeCreateEvent extends DomainEvent<ExperimentBeforeCreatePayload> {
    eventType = "experiment.beforeCreate" as const;

    getHandlerAbstraction() {
        return ExperimentBeforeCreateEventHandler;
    }
}

export class ExperimentAfterCreateEvent extends DomainEvent<ExperimentAfterCreatePayload> {
    eventType = "experiment.afterCreate" as const;

    getHandlerAbstraction() {
        return ExperimentAfterCreateEventHandler;
    }
}
