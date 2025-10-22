import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteApiKey } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { ApiKeyBeforeDeleteEvent, ApiKeyAfterDeleteEvent } from "./events.js";
import { NotAuthorizedError } from "~/index.js";

export class DeleteApiKeyUseCase {
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

    async execute(id: string): Promise<Result<void, Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
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

        return Result.ok(void 0);
    }
}

export const DeleteApiKeyUseCaseImpl = createImplementation({
    abstraction: DeleteApiKey,
    implementation: DeleteApiKeyUseCase,
    dependencies: [ApiKeysRepository, IdentityContext, EventPublisher]
});
