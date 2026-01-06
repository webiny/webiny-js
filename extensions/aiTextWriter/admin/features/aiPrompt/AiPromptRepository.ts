import {
    AiPromptRepository as Repository,
    type IAiPromptInput,
    AiPromptGateway
} from "./abstractions.js";

class AiPromptRepositoryImpl implements Repository.Interface {
    constructor(private gateway: AiPromptGateway.Interface) {}

    async prompt(input: IAiPromptInput[]): Promise<string> {
        const response = await this.gateway.prompt(input);

        // TODO: cache response for the given prompt

        return response;
    }
}

export const AiPromptRepository = Repository.createImplementation({
    implementation: AiPromptRepositoryImpl,
    dependencies: [AiPromptGateway]
});
