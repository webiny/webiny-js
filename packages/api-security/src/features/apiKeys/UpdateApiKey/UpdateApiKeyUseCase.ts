import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateApiKey } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { apiKeyInputSchema } from "../shared/schemas.js";
import { ApiKeyBeforeUpdateEvent, ApiKeyAfterUpdateEvent } from "./events.js";
import type { ApiKey, UpdateApiKeyInput } from "../shared/types.js";
import { NotAuthorizedError } from "~/index.js";
import { ApiKeyValidationError } from "../shared/errors.js";

export class UpdateApiKeyUseCase {
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

    async execute(id: string, input: UpdateApiKeyInput): Promise<Result<ApiKey, UpdateApiKey.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = apiKeyInputSchema.safeParse(input);
        if (!validation.success) {
            return Result.fail(new ApiKeyValidationError(validation.error.errors[0].message));
        }

        const existingResult = await this.repository.get(id);
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingApiKey = existingResult.value;

        const updatedApiKey: ApiKey = {
            ...existingApiKey,
            ...validation.data
        };

        await this.eventPublisher.publish(
            new ApiKeyBeforeUpdateEvent({
                original: existingApiKey,
                updated: updatedApiKey,
                input: validation.data
            })
        );

        const result = await this.repository.update(updatedApiKey);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new ApiKeyAfterUpdateEvent({
                original: existingApiKey,
                updated: updatedApiKey,
                input: validation.data
            })
        );

        return Result.ok(updatedApiKey);
    }
}

export const UpdateApiKeyUseCaseImpl = createImplementation({
    abstraction: UpdateApiKey,
    implementation: UpdateApiKeyUseCase,
    dependencies: [ApiKeysRepository, IdentityContext, EventPublisher]
});
