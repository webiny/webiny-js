import { ErrorHandler, NotFoundHandler } from "@cloudi/core";
import { createNodeServer, NodeHttpAdapter } from "@cloudi/node";
import { tenantContext } from "./context/TenantContext.js";
import { tenantInitializer } from "./handlers/TenantInitializer.js";
import { helloHandler } from "./handlers/HelloHandler.js";
import { echoHandler } from "./handlers/EchoHandler.js";
import { filesHandler } from "./handlers/FilesHandler.js";
import { greetService } from "./services/GreetService.js";

const server = createNodeServer({
    root: container => {
        container.register(greetService);

        container.register(NodeHttpAdapter);
        container.register(ErrorHandler);
        container.register(tenantInitializer);
        container.register(helloHandler);
        container.register(echoHandler);
        container.register(filesHandler);
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
