import { Result } from "@webiny/feature/api";
import {
    DeleteWebhookUseCase as UseCaseAbstraction,
    DeleteWebhookRepository
} from "./abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";

class DeleteWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getWebhookRepository: GetWebhookRepository.Interface,
        private deleteRepository: DeleteWebhookRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        const getResult = await this.getWebhookRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        return this.deleteRepository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: DeleteWebhookUseCaseImpl,
    dependencies: [GetWebhookRepository, DeleteWebhookRepository]
});
