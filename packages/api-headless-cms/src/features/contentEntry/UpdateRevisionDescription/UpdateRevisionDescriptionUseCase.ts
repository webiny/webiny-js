import { createImplementation, Result } from "@webiny/feature/api";
import { UpdateRevisionDescriptionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterUpdateRevisionDescriptionEvent,
    EntryBeforeUpdateRevisionDescriptionEvent
} from "./events.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryLockedError, EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { UpdateEntryRepository } from "../UpdateEntry/index.js";

class UpdateRevisionDescriptionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private cmsContext: CmsContext.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private getRevisionByIdUseCase: GetRevisionByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        revisionDescription: string | undefined
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Check initial access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const result = await this.getRevisionByIdUseCase.execute<T>(model, id);

            if (result.isFail()) {
                return Result.fail(result.error);
            }

            const originalEntry = result.value;

            // Check if entry is locked
            if (originalEntry.locked) {
                return Result.fail(new EntryLockedError());
            }

            const entry = {
                ...originalEntry,
                revisionDescription
            };

            // Apply access control on the updated entry
            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromModel(model));
            }

            // Publish before event
            await this.eventPublisher.publish(
                new EntryBeforeUpdateRevisionDescriptionEvent({
                    entry,
                    original: originalEntry,
                    revisionDescription,
                    model
                })
            );

            // Persist updated entry
            const updateResult = await this.repository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(updateResult.error);
            }

            // Publish after event
            await this.eventPublisher.publish(
                new EntryAfterUpdateRevisionDescriptionEvent({
                    entry,
                    original: originalEntry,
                    revisionDescription,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            // Handle errors from createUpdateEntryData or other operations
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UpdateRevisionDescriptionUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateRevisionDescriptionUseCaseImpl,
    dependencies: [
        EventPublisher,
        UpdateEntryRepository,
        AccessControl,
        CmsContext,
        TenantContext,
        IdentityContext,
        GetRevisionByIdUseCase
    ]
});
