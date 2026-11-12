import type { EventContext } from "@webiny/event-handler-core";
import {
    SqlSchemaSetupEventHandler,
    SqlSchemaSetupService,
    SQL_SCHEMA_SETUP_EVENT_IDENTIFIER,
    type ISqlSchemaSetupEvent,
    type ISqlSchemaSetupResult
} from "./abstractions.js";

/**
 * Handles the schema-setup event: reads the service manifests from the event and hands them to
 * `SqlSchemaSetupService`, which does the setup. It returns what the setup did, and throws when a
 * step fails, so the deploy fails with it.
 */
class SetupSqlSchemaHandlerImpl implements SqlSchemaSetupEventHandler.Interface {
    public constructor(private readonly service: SqlSchemaSetupService.Interface) {}

    public async execute(ctx: EventContext<ISqlSchemaSetupEvent>): Promise<ISqlSchemaSetupResult> {
        const serviceManifests =
            ctx.event[SQL_SCHEMA_SETUP_EVENT_IDENTIFIER].serviceManifests ?? [];
        if (!Array.isArray(serviceManifests)) {
            throw new Error("`serviceManifests` must be a list of { name, manifest }.");
        }

        const done = await this.service.setup({ serviceManifests });
        return { ok: true, done };
    }
}

export const SetupSqlSchemaHandler = SqlSchemaSetupEventHandler.createImplementation({
    implementation: SetupSqlSchemaHandlerImpl,
    dependencies: [SqlSchemaSetupService]
});
