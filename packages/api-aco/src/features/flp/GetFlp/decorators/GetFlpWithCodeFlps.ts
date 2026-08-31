import { GetFlpUseCase } from "../abstractions.js";
import { CodeFlpMerger, FlpsProvider } from "~/features/flp/shared/index.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";

class GetFlpWithCodeFlpsImpl implements GetFlpUseCase.Interface {
    constructor(
        private flpsProvider: FlpsProvider.Interface,
        private decoratee: GetFlpUseCase.Interface
    ) {}

    async execute(id: string): Promise<FolderLevelPermission | null> {
        const flp = await this.decoratee.execute(id);

        if (!flp) {
            return null;
        }

        const codePermissions = await this.flpsProvider.getPermissions({
            type: flp.type,
            path: flp.path
        });

        return CodeFlpMerger.merge(flp, codePermissions);
    }
}

export const GetFlpWithCodeFlps = GetFlpUseCase.createDecorator({
    decorator: GetFlpWithCodeFlpsImpl,
    dependencies: [FlpsProvider]
});
