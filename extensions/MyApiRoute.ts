import { AiService, Logger, Route } from "webiny/api";

class MyApiRouteImpl implements Route.Interface {
    constructor(
        private logger: Logger.Interface,
        private aiService: AiService.Interface
    ) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        this.logger.info("MyApiRoute: handling GET /my-api-route");

        const { text } = await this.aiService.generateText({
            model: "anthropic/claude-sonnet-4-5",
            prompt: "Say hello world in one sentence."
        });

        return reply.send({ message: text });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Logger, AiService]
});
