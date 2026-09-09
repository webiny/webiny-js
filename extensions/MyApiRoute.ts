import { HttpRouteHandler, Logger } from "webiny/api";

class MyApiRouteImpl implements HttpRouteHandler.Interface {
    constructor(private logger: Logger.Interface) {}

    async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        this.logger.info({ path: request.path }, "MyApiRoute handled a request.");

        return response.status(200).json({ message: "Hello world!" });
    }
}

export default HttpRouteHandler.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Logger]
});
