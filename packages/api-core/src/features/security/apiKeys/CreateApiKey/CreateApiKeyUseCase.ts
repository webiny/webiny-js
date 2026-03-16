import { mdbid } from "@webiny/utils";
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { CreateApiKeyUseCase as CreateApiKeyUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { createApiKeyInputSchema } from "../shared/schemas.js";
import { ApiKeyBeforeCreateEvent, ApiKeyAfterCreateEvent } from "./events.js";
import type { ApiKey, CreateApiKeyInput } from "../shared/types.js";
import type { ApiKeyPermission } from "~/types/security.js";
import { generateToken } from "../shared/generateToken.js";
import { ApiKeyValidationError, ApiKeyNotAuthorizedError } from "../shared/errors.js";

class CreateApiKeyUseCaseImpl implements CreateApiKeyUseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: ApiKeysRepository.Interface
    ) {}

    async execute(
        input: CreateApiKeyInput
    ): Promise<Result<ApiKey, CreateApiKeyUseCaseAbstraction.Error>> {
        const hasPermission =
            await this.identityContext.getPermission<ApiKeyPermission>("security.apiKey");

        if (!hasPermission) {
            return Result.fail(new ApiKeyNotAuthorizedError());
        }

        const validation = createApiKeyInputSchema.safeParse(input);
        if (!validation.success) {
            return Result.fail(new ApiKeyValidationError(validation.error.issues[0].message));
        }

        const token = generateToken();
        const identity = this.identityContext.getIdentity();
        const data = validation.data;

        const apiKey: ApiKey = {
            id: mdbid(),
            name: data.name,
            slug: data.slug,
            description: data.description,
            token,
            permissions: data.permissions,
            createdOn: new Date().toISOString(),
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            }
        };

        await this.eventPublisher.publish(
            new ApiKeyBeforeCreateEvent({ apiKey, input: validation.data })
        );

        const result = await this.repository.create(apiKey);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new ApiKeyAfterCreateEvent({ apiKey, input: validation.data })
        );

        return Result.ok(apiKey);
    }
}

export const CreateApiKeyUseCase = CreateApiKeyUseCaseAbstraction.createImplementation({
    implementation: CreateApiKeyUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, ApiKeysRepository]
});
