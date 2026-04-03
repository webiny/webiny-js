import { Route } from "webiny/api/route";
import { Logger } from "webiny/api/logger";

class MyApiRouteImpl implements Route.Interface {
    constructor(private logger: Logger.Interface) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        this.logger.info("MyApiRoute: handling GET /my-api-route");
        return reply.send({ message: request.method });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Logger]
});
