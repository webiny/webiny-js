import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { GetFileModelRepository } from "./abstractions.js";
import { FileModelProvider as Provider } from "./abstractions.js";

class FileModelProviderImpl implements Provider.Interface {
    constructor(private repository: GetFileModelRepository.Interface) {}

    async getModel(): Promise<CmsModel> {
        await this.repository.load();

        const model = this.repository.getModel();
        if (!model) {
            throw new Error("Unable to load File model!");
        }

        return model;
    }
}

export const FileModelProvider = Provider.createImplementation({
    implementation: FileModelProviderImpl,
    dependencies: [GetFileModelRepository]
});
