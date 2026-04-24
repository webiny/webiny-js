import { Result } from "@webiny/feature/api";
import { CreateModelUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateModelRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { ModelBeforeCreateEvent } from "./events.js";
import { ModelAfterCreateEvent } from "./events.js";
import { ModelCreateErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ModelNotAuthorizedError, ModelValidationError } from "~/domain/contentModel/errors.js";
import { createZodError } from "@webiny/utils";
import { removeUndefinedValues } from "@webiny/utils";
import { createModelCreateValidation } from "~/domain/contentModel/schemas.js";
import { assignModelDefaultFields } from "~/crud/contentModel/defaultFields.js";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelCreateInput } from "~/types/index.js";

/**
 * CreateModelUseCase - Core model creation orchestration.
 *
 * Responsibilities:
 * - Validate input (Zod)
 * - Create domain model object
 * - Assign default fields if requested
 * - Access control checks
 * - Publish before event
 * - Delegate to repository
 * - Publish after event or error event
 *
 * Note: This use case is decorated by CreateModelValidator which handles:
 * - ModelId generation
 * - ModelId allowed validation
 * - API name ending validation
 * - Field validation and plugin conflict checks
 */
class CreateModelUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateModelRepository.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(input: CmsModelCreateInput): Promise<Result<CmsModel, UseCaseAbstraction.Error>> {
        // Initial access control check
        const canAccess = await this.accessControl.canAccessModel({ rwd: "w" });
        if (!canAccess) {
            return Result.fail(new ModelNotAuthorizedError());
        }

        // Validate input
        const validationResult = await createModelCreateValidation().safeParseAsync(input);
        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new ModelValidationError(zodError.message));
        }

        // Extract defaultFields flag and remove it from data
        const { defaultFields, ...data } = removeUndefinedValues(validationResult.data);

        // Assign default fields if requested
        if (defaultFields) {
            assignModelDefaultFields(data);
        }

        // Create the domain model object
        const identity = this.identityContext.getIdentity();
        const tenant = this.tenantContext.getTenant();

        const model: CmsModel = {
            ...data,
            icon: data.icon ?? null,
            modelId: data.modelId ?? "", // Will be set by repository
            tenant: tenant.id,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            createdBy: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            description: data.description || "",
            // Fields and layout from data
            fields: data.fields || [],
            layout: data.layout || [],
            // Title/description/image field IDs
            titleFieldId: data.titleFieldId || "",
            descriptionFieldId: data.descriptionFieldId,
            imageFieldId: data.imageFieldId
        };

        // Access control check on the created model
        const canAccessModel = await this.accessControl.canAccessModel({ model, rwd: "w" });
        if (!canAccessModel) {
            return Result.fail(ModelNotAuthorizedError.fromModel(model));
        }

        // Publish before event
        await this.eventPublisher.publish(new ModelBeforeCreateEvent({ model, input: data }));

        // Persist via repository (repository will validate and set modelId)
        const result = await this.repository.execute(model);
        if (result.isFail()) {
            // Publish error event
            await this.eventPublisher.publish(
                new ModelCreateErrorEvent({
                    input,
                    model,
                    error: result.error
                })
            );
            return Result.fail(result.error);
        }

        // Publish after event
        await this.eventPublisher.publish(new ModelAfterCreateEvent({ model }));

        return Result.ok(model);
    }
}

export const CreateModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateModelUseCaseImpl,
    dependencies: [
        EventPublisher,
        CreateModelRepository,
        AccessControl,
        TenantContext,
        IdentityContext
    ]
});
