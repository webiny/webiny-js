import { Result } from "@webiny/feature/api";
import { BundleRemoteComponentUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRemoteComponentUseCase } from "~/api/features/getComponent/abstractions.js";
import { UpdateRemoteComponentRepository } from "~/api/features/updateComponent/abstractions.js";
import { RemoteComponentBundleError } from "~/api/domain/errors.js";
import { bundleComponent } from "~/api/bundler/index.js";

class BundleRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getComponent: GetRemoteComponentUseCase.Interface,
        private updateRepository: UpdateRemoteComponentRepository.Interface
    ) {}

    async execute(id: string) {
        const getResult = await this.getComponent.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const component = getResult.value;

        if (!component.source) {
            return Result.fail(
                new RemoteComponentBundleError(new Error("Component has no source code to bundle."))
            );
        }

        let bundled;
        try {
            bundled = await bundleComponent({
                name: component.name,
                source: component.source,
                css: component.css || undefined
            });
        } catch (error) {
            return Result.fail(new RemoteComponentBundleError(error as Error));
        }

        const updateResult = await this.updateRepository.execute(id, {
            bundledJs: bundled.bundled,
            bundledJsSha256: bundled.sha256,
            bundledCss: bundled.css ?? "",
            bundledCssSha256: bundled.cssSha256 ?? ""
        });

        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(updateResult.value);
    }
}

export const BundleRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: BundleRemoteComponentUseCaseImpl,
    dependencies: [GetRemoteComponentUseCase, UpdateRemoteComponentRepository]
});
