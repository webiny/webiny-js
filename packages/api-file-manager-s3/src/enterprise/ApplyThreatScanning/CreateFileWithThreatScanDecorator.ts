import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/abstractions.js";
import type { CreateFileInput } from "@webiny/api-file-manager/features/file/CreateFile/abstractions.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";

class CreateFileWithThreatScanDecoratorImpl implements CreateFileUseCase.Interface {
    constructor(
        private featureFlags: FeatureFlags.Interface,
        private decoratee: CreateFileUseCase.Interface
    ) {}

    async execute(
        input: CreateFileInput,
        meta?: Record<string, any>
    ): ReturnType<CreateFileUseCase.Interface["execute"]> {
        if (!this.featureFlags.get().isEnabled("fileManager.threatDetection")) {
            return this.decoratee.execute(input, meta);
        }

        const modifiedInput: CreateFileInput = {
            ...input,
            tags: [...(input.tags || []), "threatScanInProgress"]
        };

        return this.decoratee.execute(modifiedInput, meta);
    }
}

export const CreateFileWithThreatScanDecorator = CreateFileUseCase.createDecorator({
    decorator: CreateFileWithThreatScanDecoratorImpl,
    dependencies: [FeatureFlags]
});
