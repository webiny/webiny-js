import { Result } from "@webiny/feature/api";
import {
    UpdateRemoteComponentUseCase as UseCaseAbstraction,
    UpdateRemoteComponentRepository
} from "./abstractions.js";
import { RemoteComponentPermissions } from "~/api/features/permissions/abstractions.js";
import { GetRemoteComponentRepository } from "~/api/features/getComponent/abstractions.js";
import {
    RemoteComponentInvalidBundleError,
    RemoteComponentNotAuthorizedError
} from "~/api/domain/errors.js";
import { validateComponentBundle } from "~/api/bundler/validateComponentBundle.js";
import { storedBundleValues } from "~/api/features/shared/storedBundleValues.js";

class UpdateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: RemoteComponentPermissions.Interface,
        private repository: UpdateRemoteComponentRepository.Interface,
        private getRepository: GetRemoteComponentRepository.Interface
    ) {}

    async execute(id: string, input: UseCaseAbstraction.Input) {
        const canEdit = await this.permissions.canEdit("component");
        if (!canEdit) {
            return Result.fail(new RemoteComponentNotAuthorizedError());
        }

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

        if (input.bundle) {
            const bundleResult = await this.validateBundle(id, input, input.bundle);
            if (bundleResult.isFail()) {
                return Result.fail(bundleResult.error);
            }
            Object.assign(values, bundleResult.value);
        }

        return this.repository.execute(id, values);
    }

    /**
     * Validates the bundle against the component as this update leaves it: the input's name, source
     * and CSS where given, the stored ones otherwise.
     */
    private async validateBundle(
        id: string,
        input: UseCaseAbstraction.Input,
        bundle: NonNullable<UseCaseAbstraction.Input["bundle"]>
    ) {
        const flatFields = [
            input.bundledJs,
            input.bundledJsSha256,
            input.bundledCss,
            input.bundledCssSha256
        ];
        if (flatFields.some(value => value !== undefined)) {
            return Result.fail(
                new RemoteComponentInvalidBundleError([
                    "Pass either `bundle` or the `bundledJs`, `bundledCss` and hash fields, not both."
                ])
            );
        }

        const getResult = await this.getRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const stored = getResult.value;
        const css = input.css ?? stored.css;
        const validation = await validateComponentBundle(
            {
                name: input.name ?? stored.name,
                source: input.source ?? stored.source,
                css: css || undefined
            },
            bundle
        );
        if (!validation.valid) {
            return Result.fail(new RemoteComponentInvalidBundleError(validation.errors));
        }

        return Result.ok(storedBundleValues(bundle));
    }
}

export const UpdateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRemoteComponentUseCaseImpl,
    dependencies: [
        RemoteComponentPermissions,
        UpdateRemoteComponentRepository,
        GetRemoteComponentRepository
    ]
});
