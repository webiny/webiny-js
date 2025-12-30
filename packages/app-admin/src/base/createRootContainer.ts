import { createBrowserHistory } from "history";
import { Container } from "@webiny/di";
import { DefaultRouteElementRegistry } from "@webiny/app/presentation/router/RouteElementRegistry.js";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { RouterFeature } from "@webiny/app/features/router/feature.js";
import { HistoryRouterGateway } from "@webiny/app/features/router/HistoryRouterGateway.js";
import { EnvConfigFeature } from "@webiny/app/features/envConfig/feature.js";
import { GraphQLClientFeature } from "@webiny/app/features/graphqlClient/feature.js";
import { LocalStorageFeature } from "@webiny/app/features/localStorage/feature.js";
import { WcpFeature } from "~/features/wcp/feature.js";
import { TenancyFeature } from "~/features/tenancy/feature.js";
import { SystemInstallerFeature } from "~/presentation/installation/presenters/SystemInstaller/feature.js";
import { TelemetryFeature } from "~/features/telemetry/feature.js";

const isUndefined = (value: any) => [undefined, "undefined"].includes(value);

export function createRootContainer() {
    const container = new Container();

    const trashBinEnv = process.env.WBY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS;
    const trashBinRetention = isUndefined(trashBinEnv) ? 60 : parseInt(trashBinEnv as string);
    const deploymentId = String(process.env.WBY_ADMIN_DEPLOYMENT_ID);

    EnvConfigFeature.register(container, {
        deploymentId,
        apiUrl: String(process.env.REACT_APP_API_URL),
        debug: process.env.REACT_APP_DEBUG === "true",
        graphqlApiUrl: String(process.env.REACT_APP_GRAPHQL_API_URL),
        telemetryEnabled: process.env.REACT_APP_WBY_TELEMETRY === "true",
        telemetryUserId: process.env.REACT_APP_WBY_TELEMETRY_USER_ID,
        trashBinRetentionPeriodDays: trashBinRetention,
        wcpProjectId: process.env.REACT_APP_WCP_PROJECT_ID,
        websocketUrl: String(process.env.REACT_APP_WEBSOCKET_URL)
    });

    // Router
    const history = createBrowserHistory();
    container.registerInstance(RouterGateway, new HistoryRouterGateway(history, ""));
    container.register(DefaultRouteElementRegistry).inSingletonScope();

    RouterFeature.register(container);

    GraphQLClientFeature.register(container, { batching: true, retry: true });

    LocalStorageFeature.register(container, { prefix: `webiny/${deploymentId}` });

    TenancyFeature.register(container);

    WcpFeature.register(container);

    SystemInstallerFeature.register(container);

    TelemetryFeature.register(container);

    return container;
}
