import { ListFlpsUseCase } from "../abstractions.js";
import { CodeFlpMerger, FlpsProvider } from "~/features/flp/shared/index.js";
import type { FolderLevelPermission, ListFlpsParams } from "~/flp/flp.types.js";

class ListFlpsWithCodeFlpsImpl implements ListFlpsUseCase.Interface {
    constructor(
        private flpsProvider: FlpsProvider.Interface,
        private decoratee: ListFlpsUseCase.Interface
    ) {}

    async execute(params: ListFlpsParams): Promise<FolderLevelPermission[]> {
        const flps = await this.decoratee.execute(params);

        return Promise.all(
            flps.map(async flp => {
                const codePermissions = await this.flpsProvider.getPermissions({
                    type: flp.type,
                    path: flp.path
                });

                return CodeFlpMerger.merge(flp, codePermissions);
            })
        );
    }
}

export const ListFlpsWithCodeFlps = ListFlpsUseCase.createDecorator({
    decorator: ListFlpsWithCodeFlpsImpl,
    dependencies: [FlpsProvider]
});
