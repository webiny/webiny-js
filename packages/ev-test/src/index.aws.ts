import { ErrorHandler, NotFoundHandler } from "@cloudi/core";
import { createLambdaHandler, ApiGatewayAdapter } from "@cloudi/aws";
import { tenantContext } from "./context/TenantContext.js";
import { tenantInitializer } from "./handlers/TenantInitializer.js";
import { helloHandler } from "./handlers/HelloHandler.js";
import { echoHandler } from "./handlers/EchoHandler.js";
import { filesHandler } from "./handlers/FilesHandler.aws.example.js";
import { greetService } from "./services/GreetService.js";

export const handler = createLambdaHandler({
    root: container => {
        container.register(greetService);

        container.register(ApiGatewayAdapter); // translates APIGatewayProxyEvent → IHttpRequest
        container.register(ErrorHandler);
        container.register(tenantInitializer);
        container.register(helloHandler);
        container.register(echoHandler);
        container.register(filesHandler); // returns Buffer → adapter sets isBase64Encoded
        container.register(NotFoundHandler);
    },
    request: container => {
        container.register(tenantContext).inSingletonScope();
    }
});
