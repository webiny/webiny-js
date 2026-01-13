import { Result } from "@webiny/feature/api";
import { CreateModelFromUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateModelFromRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { ModelBeforeCreateFromEvent } from "./events.js";
import { ModelAfterCreateFromEvent } from "./events.js";
import { ModelCreateFromErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ModelNotAuthorizedError, ModelValidationError } from "~/domain/contentModel/errors.js";
import { createZodError } from "@webiny/utils";
import { removeUndefinedValues } from "@webiny/utils";
import { createModelCreateFromValidation } from "~/domain/contentModel/schemas.js";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelCreateFromInput } from "~/types/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";

/**
 * CreateModelFromUseCase - Clone/copy a model from existing model.
 *
 * Responsibilities:
 * - Validate input (Zod)
 * - Fetch original model
 * - Create new model preserving fields and layout
 * - Handle group changes
 * - Access control checks
 * - Publish before event
 * - Delegate to repository for validation and persistence
 * - Publish after event or error event
 *
 * Note: Repository handles domain validations (modelId generation, uniqueness, etc.)
 */
class CreateModelFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateModelFromRepository.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        modelId: string,
        input: CmsModelCreateFromInput
    ): Promise<Result<CmsModel, UseCaseAbstraction.Error>> {
        // Initial access control check
        const canAccess = await this.accessControl.canAccessModel({ rwd: "w" });
        if (!canAccess) {
            return Result.fail(new ModelNotAuthorizedError());
        }

        // Get the original model (with access control check)
        const getResult = await this.getModelUseCase.execute(modelId);
        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        // Validate input (merge with original description if not provided)
        const validationResult = await createModelCreateFromValidation().safeParseAsync({
            ...input,
            description: input.description || original.description
        });

        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new ModelValidationError(zodError.message));
        }

        const data = removeUndefinedValues(validationResult.data);

        // Create new model from original (preserve fields and layout)
        const identity = this.identityContext.getIdentity();
        const tenant = this.tenantContext.getTenant();

        const model: CmsModel = {
            ...original,
            group: input.group || original.group,
            singularApiName: data.singularApiName,
            pluralApiName: data.pluralApiName,
            icon: data.icon,
            name: data.name,
            modelId: data.modelId || "", // Will be set by repository
            description: data.description || "",
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            tenant: original.tenant || tenant.id
        };

        // Access control check on the new model
        const canAccessModel = await this.accessControl.canAccessModel({ model, rwd: "w" });
        if (!canAccessModel) {
            return Result.fail(ModelNotAuthorizedError.fromModel(model));
        }

        // Publish before event
        await this.eventPublisher.publish(
            new ModelBeforeCreateFromEvent({ model, original, input: data })
        );

        // Persist via repository (repository will validate and set modelId)
        const result = await this.repository.execute(model);
        if (result.isFail()) {
            // Publish error event
            await this.eventPublisher.publish(
                new ModelCreateFromErrorEvent({
                    input: data,
                    model,
                    original,
                    error: result.error
                })
            );
            return Result.fail(result.error);
        }

        // Publish after event
        await this.eventPublisher.publish(new ModelAfterCreateFromEvent({ model, original }));

        return Result.ok(model);
    }
}

export const CreateModelFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateModelFromUseCaseImpl,
    dependencies: [
        GetModelUseCase,
        EventPublisher,
        CreateModelFromRepository,
        AccessControl,
        TenantContext,
        IdentityContext
    ]
});
