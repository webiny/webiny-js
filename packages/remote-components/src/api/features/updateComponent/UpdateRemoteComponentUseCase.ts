import {
    UpdateRemoteComponentUseCase as UseCaseAbstraction,
    UpdateRemoteComponentRepository
} from "./abstractions.js";

class UpdateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateRemoteComponentRepository.Interface) {}

    async execute(id: string, input: UseCaseAbstraction.Input) {
        const values: Record<string, any> = {};
        if (input.name !== undefined) {
            values.name = input.name;
        }
        if (input.label !== undefined) {
            values.label = input.label;
        }
        if (input.description !== undefined) {
            values.description = input.description;
        }
        if (input.source !== undefined) {
            values.source = input.source;
        }
        if (input.css !== undefined) {
            values.css = input.css;
        }
        if (input.bundledJs !== undefined) {
            values.bundledJs = input.bundledJs;
        }
        if (input.bundledJsSha256 !== undefined) {
            values.bundledJsSha256 = input.bundledJsSha256;
        }
        if (input.bundledCss !== undefined) {
            values.bundledCss = input.bundledCss;
        }
        if (input.bundledCssSha256 !== undefined) {
            values.bundledCssSha256 = input.bundledCssSha256;
        }
        if (input.aiPrompt !== undefined) {
            values.aiPrompt = input.aiPrompt;
        }
        if (input.status !== undefined) {
            values.status = input.status;
        }
        return this.repository.execute(id, values);
    }
}

export const UpdateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRemoteComponentUseCaseImpl,
    dependencies: [UpdateRemoteComponentRepository]
});
