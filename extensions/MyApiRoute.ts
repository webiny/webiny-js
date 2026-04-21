import { Encryption, Route, Ai } from "webiny/api";

class MyApiRouteImpl implements Route.Interface {
    constructor(
        private encryptionService: Encryption.Interface,
        private ai: Ai.Interface
    ) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        const encryptedString = this.encryptionService.encrypt("my-secret");
        return reply.send({ encryptedString });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [Encryption, Ai]
});
