import { createBrowserHistory } from "history";
import { Container } from "@webiny/di-container";
import { RouterFeature } from "@webiny/app/features/router/feature.js";
import { DefaultRouteElementRegistry } from "@webiny/app/presentation/router/RouteElementRegistry.js";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { HistoryRouterGateway } from "@webiny/app/features/router/HistoryRouterGateway.js";
import { EnvConfigFeature } from "@webiny/app/features/envConfig";
import { GraphQLClientFeature } from "@webiny/app/features/graphqlClient";
import { LocalStorageFeature } from "@webiny/app/features/localStorage";
import { WcpFeature } from "~/features/wcp/feature.js";
import { TenancyFeature } from "~/features/tenancy/feature.js";

const isUndefined = (value: any) => [undefined, "undefined"].includes(value);

export function createRootContainer() {
    const container = new Container();

    const trashBinEnv = process.env.WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS;
    const trashBinRetention = isUndefined(trashBinEnv) ? 60 : parseInt(trashBinEnv as string);
    const deploymentId = String(process.env.WEBINY_ADMIN_DEPLOYMENT_ID);

    EnvConfigFeature.register(container, {
        deploymentId,
        apiUrl: String(process.env.REACT_APP_API_URL),
        debug: process.env.REACT_APP_DEBUG === "true",
        graphqlApiUrl: String(process.env.REACT_APP_GRAPHQL_API_URL),
        telemetryEnabled: process.env.REACT_APP_WEBINY_TELEMETRY === "true",
        telemetryUserId: process.env.REACT_APP_WEBINY_TELEMETRY_USER_ID,
        trashBinRetentionPeriodDays: trashBinRetention,
        wcpProjectId: process.env.REACT_APP_WCP_PROJECT_ID,
        webinyVersion: String(process.env.REACT_APP_WEBINY_VERSION),
        websocketUrl: String(process.env.REACT_APP_WEBSOCKET_URL)
        // graphqlClient: {
        //     retries: {
        //         maxRetries: 3,
        //         delayInMillis: 100
        //     }
        // }
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

    return container;
}
