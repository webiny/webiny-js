import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FileFieldsProvider as Abstraction } from "./abstractions.js";

class FileFieldsProviderWithFeatureFlagsImpl implements Abstraction.Interface {
    constructor(
        private featureFlagsService: FeatureFlagsService.Interface,
        private decoratee: Abstraction.Interface
    ) {}

    async execute(): Promise<string[]> {
        const fields = await this.decoratee.execute();

        if (this.featureFlagsService.getFlags().isPrivateFilesEnabled()) {
            return [...fields, "accessControl.type"];
        }

        return fields;
    }
}

export const FileFieldsProviderWithWcp = Abstraction.createDecorator({
    decorator: FileFieldsProviderWithFeatureFlagsImpl,
    dependencies: [FeatureFlagsService]
});
