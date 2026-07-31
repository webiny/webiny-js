import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/abstractions.js";
import type { CreateFileInput } from "@webiny/api-file-manager/features/file/CreateFile/abstractions.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

class CreateFileWithThreatScanDecoratorImpl implements CreateFileUseCase.Interface {
    constructor(
        private wcp: WcpContext.Interface,
        private decoratee: CreateFileUseCase.Interface
    ) {}

    async execute(
        input: CreateFileInput,
        meta?: Record<string, any>
    ): ReturnType<CreateFileUseCase.Interface["execute"]> {
        // WCP-gated at request time (the license is only known post-auth). When threat detection isn't
        // licensed, pass through unchanged — behaviourally identical to this decorator not being
        // registered (no threatScanInProgress tag added).
        if (!this.wcp.canUseFileManagerThreatDetection()) {
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
    dependencies: [WcpContext]
});
