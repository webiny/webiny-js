/**
 * Exercises the parts of `<Api.Route>` that are easy to get wrong: a path parameter, and the
 * `:orderId` spelling. API Gateway needs `{orderId}` and the router needs `:orderId`; the extension
 * converts per consumer, so either spelling in `webiny.config.tsx` should reach this handler with
 * `pathParameters.orderId` populated.
 */
import { HttpRouteHandler, Logger } from "webiny/api";

class MyApiEchoRouteImpl implements HttpRouteHandler.Interface {
    constructor(private logger: Logger.Interface) {}

    async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        const orderId = request.pathParameters.orderId;

        this.logger.info({ orderId }, "MyApiEchoRoute handled a request.");

        return response.status(200).json({
            orderId,
            method: request.method,
            query: request.query
        });
    }
}

export default HttpRouteHandler.createImplementation({
    implementation: MyApiEchoRouteImpl,
    dependencies: [Logger]
});
