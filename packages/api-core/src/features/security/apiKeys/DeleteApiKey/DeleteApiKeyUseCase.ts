import { EventPublisher } from "~/features/eventPublisher/index.js";
import { Result } from "@webiny/feature/api";
import { DeleteApiKeyUseCase as DeleteApiKeyUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { ApiKeyBeforeDeleteEvent, ApiKeyAfterDeleteEvent } from "./events.js";
import { ApiKeyNotAuthorizedError } from "~/features/security/apiKeys/shared/errors.js";

class DeleteApiKeyUseCaseImpl implements DeleteApiKeyUseCaseAbstraction.Interface {
    private repository: ApiKeysRepository.Interface;
    private identityContext: IdentityContext.Interface;
    private eventPublisher: EventPublisher.Interface;

    constructor(
        repository: ApiKeysRepository.Interface,
        identityContext: IdentityContext.Interface,
        eventPublisher: EventPublisher.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
        this.eventPublisher = eventPublisher;
    }

    async execute(id: string): Promise<Result<void, DeleteApiKeyUseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        const existingResult = await this.repository.get(id);
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingApiKey = existingResult.value;

        await this.eventPublisher.publish(new ApiKeyBeforeDeleteEvent({ apiKey: existingApiKey }));

        const result = await this.repository.delete(existingApiKey);

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new ApiKeyAfterDeleteEvent({ apiKey: existingApiKey }));

        return Result.ok();
    }
}

export const DeleteApiKeyUseCase = DeleteApiKeyUseCaseAbstraction.createImplementation({
    implementation: DeleteApiKeyUseCaseImpl,
    dependencies: [ApiKeysRepository, IdentityContext, EventPublisher]
});
