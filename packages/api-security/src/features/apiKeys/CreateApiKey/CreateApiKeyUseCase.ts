import { mdbid } from "@webiny/utils";
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-tenancy/features/TenantContext";
import { EventPublisher } from "@webiny/api-core";
import { CreateApiKey } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import { createApiKeyInputSchema } from "../shared/schemas.js";
import { ApiKeyBeforeCreateEvent, ApiKeyAfterCreateEvent } from "./events.js";
import type { ApiKey, CreateApiKeyInput } from "../shared/types.js";
import type { ApiKeyPermission } from "~/types.js";
import { NotAuthorizedError } from "~/index.js";
import { generateToken } from "~/features/apiKeys/shared/generateToken.js";

export class CreateApiKeyUseCase {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: ApiKeysRepository.Interface
    ) {}

    async execute(input: CreateApiKeyInput): Promise<Result<ApiKey, Error>> {
        const hasPermission =
            await this.identityContext.getPermission<ApiKeyPermission>("security.apiKey");

        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = createApiKeyInputSchema.safeParse(input);
        if (!validation.success) {
            return Result.fail(new Error(validation.error.errors[0].message));
        }

        const tenant = this.tenantContext.getTenant();

        const token = generateToken();
        const identity = this.identityContext.getIdentity();
        const data = validation.data;

        const apiKey: ApiKey = {
            id: mdbid(),
            name: data.name,
            description: data.description,
            token,
            permissions: data.permissions,
            tenant: tenant.id || "root",
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

export const CreateApiKeyUseCaseImpl = createImplementation({
    abstraction: CreateApiKey,
    implementation: CreateApiKeyUseCase,
    dependencies: [TenantContext, IdentityContext, EventPublisher, ApiKeysRepository]
});
