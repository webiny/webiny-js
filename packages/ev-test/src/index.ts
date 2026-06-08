import {
    ErrorHandler,
    NotFoundHandler,
    HttpRouterHandler,
    HttpFeature
} from "@webiny/event-handler";
import { createNodeServer } from "@webiny/event-handler-node";
import { NodeHttpEventType, NodeHttpTranslator } from "@webiny/event-handler-node";
import { tenantContext } from "./context/TenantContext.js";
import { tenantInitializer } from "./handlers/TenantInitializer.js";
import { helloHandler } from "./handlers/HelloHandler.js";
import { echoHandler } from "./handlers/EchoHandler.js";
import { filesHandler } from "./handlers/FilesHandler.js";
import { greetService } from "./services/GreetService.js";

const server = createNodeServer({
    root: container => {
        // Event type detection
        container.register(NodeHttpEventType);

        // HTTP infrastructure (HttpRouter + SecureHeadersDecorator)
        HttpFeature.register(container);

        // Routes (resolved by HttpRouter)
        container.register(helloHandler);
        container.register(echoHandler);
        container.register(filesHandler);

        // Services
        container.register(greetService);

        // HttpEventHandler chain (runs for Node HTTP events)
        container.register(NodeHttpTranslator); // first — translates IncomingMessage → IHttpRequest
        container.register(ErrorHandler);
        container.register(tenantInitializer);
        container.register(HttpRouterHandler);
        container.register(NotFoundHandler);
    },
    request: container => {
        container.register(tenantContext).inSingletonScope();
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`ev-test server running on http://localhost:${PORT}`);
    console.log(`  GET  http://localhost:${PORT}/hello?name=Adrian  -H "x-tenant: acme"`);
    console.log(`  POST http://localhost:${PORT}/echo               -H "x-tenant: acme"`);
    console.log(`  GET  http://localhost:${PORT}/files/logo.svg      -H "x-tenant: acme"`);
    console.log(`  GET  http://localhost:${PORT}/unknown             → 404`);
});
