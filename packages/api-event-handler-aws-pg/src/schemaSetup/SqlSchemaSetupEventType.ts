import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import {
    SQL_SCHEMA_SETUP_EVENT_IDENTIFIER,
    SqlSchemaSetupEventHandler,
    type ISqlSchemaSetupEvent
} from "./abstractions.js";

/** Recognizes the schema-setup event and routes it to `SqlSchemaSetupEventHandler`. */
class SqlSchemaSetupEventTypeImpl implements IEventType<ISqlSchemaSetupEvent> {
    canHandle(event: any): event is ISqlSchemaSetupEvent {
        const payload = event?.[SQL_SCHEMA_SETUP_EVENT_IDENTIFIER];
        return typeof payload === "object" && payload !== null;
    }

    getHandlerAbstraction() {
        return SqlSchemaSetupEventHandler;
    }
}

export const SqlSchemaSetupEventType = EventType.createImplementation({
    implementation: SqlSchemaSetupEventTypeImpl,
    dependencies: []
});
