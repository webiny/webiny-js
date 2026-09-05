import { Result } from "@webiny/feature/api";
import { UpdateApiKeyUseCase as UpdateApiKeyUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { updateApiKeyInputSchema } from "../shared/schemas.js";
import { ApiKeyBeforeUpdateEvent, ApiKeyAfterUpdateEvent } from "./events.js";
import type { ApiKey, UpdateApiKeyInput } from "../shared/types.js";
import { ApiKeyNotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";
import { descriptionOnUpdate } from "../../shared/description.js";

class UpdateApiKeyUseCaseImpl implements UpdateApiKeyUseCaseAbstraction.Interface {
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

    async execute(
        id: string,
        input: UpdateApiKeyInput
    ): Promise<Result<ApiKey, UpdateApiKeyUseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.apiKey");
        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        const validation = updateApiKeyInputSchema.safeParse(input);
        if (!validation.success) {
            return Result.fail(new ApiKeyValidationError(validation.error.issues[0].message));
        }

        const existingResult = await this.repository.get(id);
        if (existingResult.isFail()) {
            return Result.fail(existingResult.error);
        }

        const existingApiKey = existingResult.value;

        // `description` is pulled out of the spread because it is the one field that accepts null.
        // Normalising it here keeps null out of both the entity and the published events, whose
        // input type declares `description?: string`.
        const { description, ...rest } = validation.data;

        const changes: UpdateApiKeyInput = {
            ...rest,
            ...descriptionOnUpdate(description)
        };

        const updatedApiKey: ApiKey = {
            ...existingApiKey,
            ...changes
        };

        await this.eventPublisher.publish(
            new ApiKeyBeforeUpdateEvent({
                original: existingApiKey,
                updated: updatedApiKey,
                input: changes
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
                input: changes
            })
        );

        return Result.ok(updatedApiKey);
    }
}

export const UpdateApiKeyUseCase = UpdateApiKeyUseCaseAbstraction.createImplementation({
    implementation: UpdateApiKeyUseCaseImpl,
    dependencies: [ApiKeysRepository, IdentityContext, EventPublisher]
});
