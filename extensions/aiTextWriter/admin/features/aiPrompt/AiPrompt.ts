import {
    AiPrompt as Abstraction,
    AiPromptRepository,
    type IAiPromptInput
} from "./abstractions.js";

class AiPromptImpl implements Abstraction.Interface {
    constructor(private repository: AiPromptRepository.Interface) {}

    prompt(input: IAiPromptInput[]): Promise<string> {
        return this.repository.prompt(input);
    }
}

export const AiPrompt = Abstraction.createImplementation({
    implementation: AiPromptImpl,
    dependencies: [AiPromptRepository]
});
