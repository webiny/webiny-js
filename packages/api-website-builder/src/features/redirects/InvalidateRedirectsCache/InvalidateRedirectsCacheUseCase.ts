import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { InvalidateRedirectsCacheUseCase as UseCaseAbstraction } from "./abstractions.js";

class InvalidateRedirectsCacheUseCaseImpl implements UseCaseAbstraction.Interface {
    private readonly path = "/wb/redirects";

    constructor(private cdnCache: CdnCache.Interface) {}

    async execute(): Promise<void> {
        await this.cdnCache.invalidate({
            caller: "wb.redirects",
            paths: [this.path]
        });
    }
}

export const InvalidateRedirectsCacheUseCase = UseCaseAbstraction.createImplementation({
    implementation: InvalidateRedirectsCacheUseCaseImpl,
    dependencies: [CdnCache]
});
