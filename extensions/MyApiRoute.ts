import { Ai, Route } from "webiny/api";

class MyApiRouteImpl implements Route.Interface {
    constructor(private ai: Ai.Interface) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        // AI ready!
        const { text } = await this.ai.generateText({
            model: "anthropic/claude-sonnet-4-5",
            prompt: "Hello world!"
        });

        return reply.send({ message: text });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Ai]
});
