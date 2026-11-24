import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { SqlSchemaSetupEventType } from "./SqlSchemaSetupEventType.js";
import { SetupSqlSchemaHandler } from "./SetupSqlSchemaHandler.js";
import { SqlSchemaSetupServiceImplementation } from "./SqlSchemaSetupService.js";

/**
 * The deploy-time schema setup, registered in the root container: the event the deployment invokes
 * the API's function with, its handler, and the service that does the setup. The connection it runs
 * on (`SqlSchemaSetupConnection`) is registered by the handler factory, from its config.
 */
export const SqlSchemaSetupFeature = createFeature({
    name: "SqlSchemaSetupFeature",
    register(container: Container) {
        container.register(SqlSchemaSetupEventType);
        container.register(SetupSqlSchemaHandler);
        container.register(SqlSchemaSetupServiceImplementation).inSingletonScope();
    }
});
