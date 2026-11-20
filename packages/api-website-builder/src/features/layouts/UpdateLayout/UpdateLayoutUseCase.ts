import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    UpdateLayoutRepository,
    UpdateLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { LayoutAfterUpdateEvent, LayoutBeforeUpdateEvent } from "./events.js";
import { GetLayoutUseCase } from "~/features/layouts/GetLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import {
    LayoutLockedError,
    LayoutNotAuthorizedError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import { LayoutDocument } from "~/domain/layout/LayoutDocument.js";
import { DocumentElements } from "~/domain/globals/DocumentElements.js";
import { LayoutProperties } from "~/domain/layout/LayoutProperties.js";
import { LayoutSlug } from "~/domain/layout/LayoutSlug.js";
import { LayoutSlugAvailability } from "~/features/layouts/LayoutSlugs/index.js";

class UpdateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutUseCase.Interface,
        private repository: UpdateLayoutRepository.Interface,
        private slugAvailability: LayoutSlugAvailability.Interface
    ) {}

    async execute(id: string, data: UseCaseAbstraction.Data): UseCaseAbstraction.Return {
        // Layouts are part of the pages they're rendered around, so they take the page permissions.
        const hasPermission = await this.permissions.canEdit("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        // Reading the original enforces the read and access checks.
        const originalResult = await this.getLayout.execute(id);
        if (originalResult.isFail()) {
            return originalResult;
        }

        const original = originalResult.value;

        const canEdit = await this.permissions.canEdit("page", original);
        if (!canEdit) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        if (original.locked) {
            return Result.fail(new LayoutLockedError(original.id));
        }

        let properties = original.properties;
        if (data.properties !== undefined) {
            const updated = LayoutProperties.update(original.properties, data.properties);
            const error = updated.validate();
            if (error) {
                return Result.fail(new LayoutValidationError(error));
            }

            // A changed slug must be free.
            const slug = updated.slug();
            const originalSlug = original.properties.slug
                ? LayoutSlug.from(original.properties.slug)
                : null;
            if (slug && !(originalSlug && slug.equals(originalSlug))) {
                const available = await this.slugAvailability.ensureAvailable(
                    slug,
                    original.entryId
                );
                if (available.isFail()) {
                    return Result.fail(available.error);
                }
            }
            properties = updated.toJSON();
        }

        const elements =
            data.elements !== undefined
                ? DocumentElements.from(data.elements).withoutGlobalInstances().toJSON()
                : original.elements;
        const bindings = data.bindings !== undefined ? data.bindings : original.bindings;

        if (data.elements !== undefined || data.bindings !== undefined) {
            const error = LayoutDocument.from({ elements, bindings }).validate();
            if (error) {
                return Result.fail(new LayoutValidationError(error));
            }
        }

        const input = { id, data };

        await this.eventPublisher.publish(new LayoutBeforeUpdateEvent({ original, input }));

        const result = await this.repository.execute(original.id, {
            properties,
            metadata: data.metadata ?? original.metadata ?? {},
            elements,
            bindings,
            extensions: data.extensions ?? original.extensions ?? {}
        });
        if (result.isFail()) {
            return result;
        }

        // Updating a draft doesn't change which revision is published.
        const layout = { ...result.value, live: original.live };

        await this.eventPublisher.publish(new LayoutAfterUpdateEvent({ original, input, layout }));

        return Result.ok(layout);
    }
}

export const UpdateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateLayoutUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutUseCase,
        UpdateLayoutRepository,
        LayoutSlugAvailability
    ]
});
