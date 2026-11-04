import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { DuplicateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { LayoutAfterDuplicateEvent, LayoutBeforeDuplicateEvent } from "./events.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { CreateLayoutUseCase } from "~/features/layouts/CreateLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError, LayoutValidationError } from "~/domain/layout/errors.js";
import { LayoutSlug } from "~/domain/layout/LayoutSlug.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";
import { LayoutSlugAvailability } from "~/features/layouts/LayoutSlugs/index.js";

class DuplicateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private createLayout: CreateLayoutUseCase.Interface,
        private slugAvailability: LayoutSlugAvailability.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const getResult = await this.getLayout.execute(params.id);
        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canAccess = await this.permissions.canAccess("page", original);
        if (!canAccess) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        if (LayoutLineage.from(original).isLanguageVersion()) {
            return Result.fail(
                new LayoutValidationError(
                    "Only source layouts can be duplicated, not their language versions."
                )
            );
        }

        await this.eventPublisher.publish(new LayoutBeforeDuplicateEvent({ original }));

        // The duplicate is a brand-new layout, so it goes through the regular create flow (and its events).
        const copy = structuredClone({
            properties: original.properties,
            metadata: original.metadata,
            elements: original.elements,
            bindings: original.bindings,
            extensions: original.extensions
        });

        // The copy gets the first free of `{slug}-copy`, `{slug}-copy-2`, ...
        const title = `${original.properties.title} (copy)`;
        const slug = await this.slugAvailability.firstAvailable(
            original.properties.slug
                ? LayoutSlug.from(original.properties.slug).copy()
                : LayoutSlug.fromTitle(title)
        );
        if (slug.isFail()) {
            return Result.fail(slug.error);
        }

        const result = await this.createLayout.execute({
            ...copy,
            properties: { ...copy.properties, title, slug: slug.value.toString() }
        });
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new LayoutAfterDuplicateEvent({ original, layout: result.value })
        );

        return result;
    }
}

export const DuplicateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: DuplicateLayoutUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutRepository,
        CreateLayoutUseCase,
        LayoutSlugAvailability
    ]
});
