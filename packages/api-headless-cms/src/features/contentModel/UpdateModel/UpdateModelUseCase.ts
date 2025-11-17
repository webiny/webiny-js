import { Result } from "@webiny/feature/api";
import { UpdateModelUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateModelRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { ModelBeforeUpdateEvent } from "./events.js";
import { ModelAfterUpdateEvent } from "./events.js";
import { ModelUpdateErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { CmsContext } from "~/features/shared/abstractions.js";
import {
    ModelNotAuthorizedError,
    ModelPersistenceError,
    ModelValidationError
} from "~/domain/contentModel/errors.js";
import { createZodError } from "@webiny/utils";
import { removeUndefinedValues } from "@webiny/utils";
import { createModelUpdateValidation } from "~/domain/contentModel/schemas.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelUpdateInput } from "~/types/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "~/features/contentModelGroup/GetGroup/index.js";

/**
 * UpdateModelUseCase - Core model update orchestration.
 *
 * Responsibilities:
 * - Validate input (Zod)
 * - Fetch original model
 * - Create updated domain model object
 * - Handle group changes
 * - Handle field ID changes (title, description, image)
 * - Access control checks
 * - Publish before event
 * - Delegate to repository for validation and persistence
 * - Publish after event or error event
 *
 * Note: Repository handles domain validations (API name uniqueness, field validation, etc.)
 */
class UpdateModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getGroupUseCase: GetGroupUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateModelRepository.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(
        modelId: string,
        input: CmsModelUpdateInput
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

        const original = structuredClone(getResult.value);

        // Validate input
        const validationResult = await createModelUpdateValidation().safeParseAsync(input);
        if (!validationResult.success) {
            const zodError = createZodError(validationResult.error);
            return Result.fail(new ModelValidationError(zodError.message));
        }

        const data = removeUndefinedValues(validationResult.data);

        // If no changes, return original
        if (Object.keys(data).length === 0) {
            return Result.ok(original);
        }

        // Handle group changes
        let group = {
            id: original.group.id,
            name: original.group.name
        };

        if (data.group) {
            const groupResult = await this.getGroupUseCase.execute(data.group);

            if (groupResult.isFail()) {
                const error = groupResult.error;
                if (error.code === "Cms/ModelGroup/PersistenceError") {
                    return Result.fail(new ModelPersistenceError(error));
                }

                return Result.fail(error);
            }

            const groupData = groupResult.value;
            group = {
                id: groupData.id,
                name: groupData.name
            };
        }

        // Create updated model
        const tenant = this.tenantContext.getTenant();

        const model: CmsModel = {
            ...original,
            ...data,
            // Handle optional field IDs explicitly
            titleFieldId:
                data.titleFieldId === undefined
                    ? original.titleFieldId
                    : (data.titleFieldId as string),
            descriptionFieldId:
                data.descriptionFieldId === undefined
                    ? original.descriptionFieldId
                    : data.descriptionFieldId,
            imageFieldId:
                data.imageFieldId === undefined ? original.imageFieldId : data.imageFieldId,
            group,
            description: data.description || original.description,
            tenant: original.tenant || tenant.id,
            webinyVersion: this.cmsContext.WEBINY_VERSION,
            savedOn: new Date().toISOString()
        };

        // Access control check on the updated model
        const canAccessModel = await this.accessControl.canAccessModel({ model, rwd: "w" });
        if (!canAccessModel) {
            return Result.fail(ModelNotAuthorizedError.fromModel(model));
        }

        // Ensure type tags
        model.tags = ensureTypeTag(model);

        // Publish before event
        await this.eventPublisher.publish(
            new ModelBeforeUpdateEvent({ model, original, input: data })
        );

        // Persist via repository (repository will validate)
        const result = await this.repository.execute(model, original);
        if (result.isFail()) {
            // Publish error event
            await this.eventPublisher.publish(
                new ModelUpdateErrorEvent({
                    input: data,
                    model,
                    original,
                    error: result.error
                })
            );
            return Result.fail(result.error);
        }

        // Publish after event
        await this.eventPublisher.publish(new ModelAfterUpdateEvent({ model, original }));

        return Result.ok(model);
    }
}

export const UpdateModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateModelUseCaseImpl,
    dependencies: [
        GetModelUseCase,
        GetGroupUseCase,
        EventPublisher,
        UpdateModelRepository,
        AccessControl,
        TenantContext,
        CmsContext
    ]
});
