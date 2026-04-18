import { Ai, Logger, Route } from "webiny/api";

class MyApiRouteImpl implements Route.Interface {
    constructor(
        private logger: Logger.Interface,
        private aiService: Ai.Interface
    ) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        // AI ready!
        const { text } = await this.aiService.generateText({
            model: "anthropic/claude-sonnet-4-5",
            connection: 'my-other-conn',
            prompt: "Is this working?!"
        });

        return reply.send({ message: text });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Logger, Ai]
});
