import { Result } from "@webiny/feature/api";
import {
    CreateRemoteComponentUseCase as UseCaseAbstraction,
    CreateRemoteComponentRepository
} from "./abstractions.js";
import { RemoteComponentPermissions } from "~/api/features/permissions/abstractions.js";
import {
    RemoteComponentInvalidBundleError,
    RemoteComponentNotAuthorizedError
} from "~/api/domain/errors.js";
import { validateComponentBundle } from "~/api/bundler/validateComponentBundle.js";
import { storedBundleValues } from "~/api/features/shared/storedBundleValues.js";

class CreateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: RemoteComponentPermissions.Interface,
        private repository: CreateRemoteComponentRepository.Interface
    ) {}

    async execute(input: UseCaseAbstraction.Input) {
        const canCreate = await this.permissions.canCreate("component");
        if (!canCreate) {
            return Result.fail(new RemoteComponentNotAuthorizedError());
        }

        const { bundle, ...component } = input;
        if (!bundle) {
            return this.repository.execute(component);
        }

        const validation = await validateComponentBundle(
            { name: input.name, source: input.source, css: input.css || undefined },
            bundle
        );
        if (!validation.valid) {
            return Result.fail(new RemoteComponentInvalidBundleError(validation.errors));
        }

        const bundleValues = storedBundleValues(bundle);

        return this.repository.execute({ ...component, ...bundleValues });
    }
}

export const CreateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRemoteComponentUseCaseImpl,
    dependencies: [RemoteComponentPermissions, CreateRemoteComponentRepository]
});
