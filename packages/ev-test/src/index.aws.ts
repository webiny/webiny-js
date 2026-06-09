import {
    ErrorHandler,
    NotFoundHandler,
    HttpRouterHandler,
    HttpFeature
} from "@webiny/event-handler-core";
import {
    createLambdaHandler,
    ApiGatewayEventType,
    ApiGatewayTranslator
} from "@webiny/event-handler-aws";
import { tenantContext } from "./context/TenantContext.js";
import { tenantInitializer } from "./handlers/TenantInitializer.js";
import { helloHandler } from "./handlers/HelloHandler.js";
import { echoHandler } from "./handlers/EchoHandler.js";
import { filesHandler } from "./handlers/FilesHandler.aws.example.js";
import { greetService } from "./services/GreetService.js";

export const handler = createLambdaHandler({
    root: container => {
        // Event type detection
        container.register(ApiGatewayEventType);

        // HTTP infrastructure
        HttpFeature.register(container);

        // Routes
        container.register(helloHandler);
        container.register(echoHandler);
        container.register(filesHandler);

        // Services
        container.register(greetService);

        // HttpEventHandler chain (runs for API Gateway events)
        container.register(ApiGatewayTranslator); // first — translates APIGatewayProxyEvent → IHttpRequest
        container.register(ErrorHandler);
        container.register(tenantInitializer);
        container.register(HttpRouterHandler);
        container.register(NotFoundHandler);
    },
    request: container => {
        container.register(tenantContext).inSingletonScope();
    }
});
