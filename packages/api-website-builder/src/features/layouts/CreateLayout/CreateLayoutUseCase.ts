import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreateLayoutRepository,
    CreateLayoutUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { LayoutAfterCreateEvent, LayoutBeforeCreateEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError, LayoutValidationError } from "~/domain/layout/errors.js";
import { LayoutDocument } from "~/domain/layout/LayoutDocument.js";
import { DocumentElements } from "~/domain/globals/DocumentElements.js";
import { LayoutProperties } from "~/domain/layout/LayoutProperties.js";
import { LayoutSlug } from "~/domain/layout/LayoutSlug.js";
import { LayoutSlugAvailability } from "~/features/layouts/LayoutSlugs/index.js";

class CreateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: CreateLayoutRepository.Interface,
        private slugAvailability: LayoutSlugAvailability.Interface
    ) {}

    async execute(data: UseCaseAbstraction.Data): UseCaseAbstraction.Return {
        // Layouts are part of the pages they're rendered around, so they take the page permissions.
        const canCreate = await this.permissions.canCreate("page");
        if (!canCreate) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const layoutProperties = LayoutProperties.create(data.properties);
        const propertiesError = layoutProperties.validate();
        if (propertiesError) {
            return Result.fail(new LayoutValidationError(propertiesError));
        }

        // A sent slug must be free; without one, the layout gets the first free slug made from its title.
        let slug = layoutProperties.slug();
        if (slug) {
            const available = await this.slugAvailability.ensureAvailable(slug);
            if (available.isFail()) {
                return Result.fail(available.error);
            }
        } else {
            const free = await this.slugAvailability.firstAvailable(
                LayoutSlug.fromTitle(layoutProperties.toJSON().title)
            );
            if (free.isFail()) {
                return Result.fail(free.error);
            }
            slug = free.value;
        }
        const properties = layoutProperties.withSlug(slug).toJSON();

        const document =
            data.elements === undefined && data.bindings === undefined
                ? LayoutDocument.createDefault()
                : LayoutDocument.from({
                      elements: DocumentElements.from(data.elements)
                          .withoutGlobalInstances()
                          .toJSON(),
                      bindings: data.bindings
                  });

        const error = document.validate();
        if (error) {
            return Result.fail(new LayoutValidationError(error));
        }

        const layoutData = {
            properties,
            metadata: data.metadata ?? {},
            elements: document.elements,
            bindings: document.bindings,
            extensions: data.extensions ?? {}
        };

        await this.eventPublisher.publish(new LayoutBeforeCreateEvent({ input: layoutData }));

        const result = await this.repository.execute(layoutData);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new LayoutAfterCreateEvent({ layout: result.value }));

        return result;
    }
}

export const CreateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateLayoutUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, CreateLayoutRepository, LayoutSlugAvailability]
});
