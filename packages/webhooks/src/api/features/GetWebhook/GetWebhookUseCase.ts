import { Result } from "@webiny/feature/api";
import { GetWebhookUseCase as UseCaseAbstraction, GetWebhookRepository } from "./abstractions.js";
import type { IWebhook } from "~/api/domain/types.js";

class GetWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetWebhookRepository.Interface) {}

    async execute(id: string): Promise<Result<IWebhook, UseCaseAbstraction.Error>> {
        return this.repository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetWebhookUseCaseImpl,
    dependencies: [GetWebhookRepository]
});
