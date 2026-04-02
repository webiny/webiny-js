import { Route } from "webiny/api/route";
import { Logger } from "webiny/api/logger";

class MyApiRouteImpl implements Route.Interface {
    constructor(private logger: Logger.Interface) {}

    async execute(req: any, res: any) {
        this.logger.info("MyApiRoute: handling GET /my-api-route");
        return res.send({ message: "Hello from MyApiRoute!" });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Logger]
});
