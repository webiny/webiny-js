import { Result } from "@webiny/feature/api";
import {
    UpdateRemoteComponentUseCase as UseCaseAbstraction,
    UpdateRemoteComponentRepository
} from "./abstractions.js";
import { GetRemoteComponentUseCase } from "~/api/features/getComponent/abstractions.js";

class UpdateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: UpdateRemoteComponentRepository.Interface,
        private getComponent: GetRemoteComponentUseCase.Interface
    ) {}

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
        if (input.aiPrompt !== undefined) {
            values.aiPrompt = input.aiPrompt;
        }

        // Changing what a component *is* invalidates the bundle built from it. This is the only
        // writer of `source` and `css`, so it is the only place the transition has to be made —
        // rather than inferring staleness later from a hash of the source that is not stored.
        //
        // Only from `bundled`: a `draft` has no bundle to invalidate, and a `failed` one stays failed
        // until someone bundles it again.
        if (input.bundle) {
            // A caller that already built the bundle is replacing the source and its bundle together,
            // so there is no window in which the two disagree and nothing to mark stale.
            values.bundledJs = input.bundle.bundledJs;
            values.bundledJsSha256 = input.bundle.bundledJsSha256;
            values.bundledCss = input.bundle.bundledCss;
            values.bundledCssSha256 = input.bundle.bundledCssSha256;
            values.manifest = input.bundle.manifest;
            values.status = "bundled";
            values.bundleError = "";
        } else if (values.source !== undefined || values.css !== undefined) {
            const current = await this.getComponent.execute(id);

            if (current.isFail()) {
                return Result.fail(current.error);
            }

            if (current.value.status === "bundled") {
                values.status = "stale";
            }
        }

        return this.repository.execute(id, values);
    }
}

export const UpdateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRemoteComponentUseCaseImpl,
    dependencies: [UpdateRemoteComponentRepository, GetRemoteComponentUseCase]
});
