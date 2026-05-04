import { Route } from "webiny/api";

class MyApiRouteImpl implements Route.Interface {
    constructor() {}

    async execute(request: Route.Request, reply: Route.Reply) {
        return reply.send({ message: "Hello world!" });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: []
});
