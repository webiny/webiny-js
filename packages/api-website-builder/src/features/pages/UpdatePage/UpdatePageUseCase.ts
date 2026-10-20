import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdatePageUseCase as UseCaseAbstraction, UpdatePageRepository } from "./abstractions.js";
import { PageBeforeUpdateEvent, PageAfterUpdateEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { PageToEntryValuesMapper } from "~/domain/page/PageToEntryValuesMapper.js";
import type { WbPage } from "~/domain/page/abstractions.js";

/** The page as it will be after the update. Fields the update leaves out keep their stored value. */
const applyUpdate = (original: WbPage, data: UseCaseAbstraction.UpdateData): WbPage => {
    return {
        ...original,
        location: data.location ?? original.location,
        properties: (data.properties as WbPage["properties"] | undefined) ?? original.properties,
        metadata: data.metadata ?? original.metadata,
        bindings: data.bindings ?? original.bindings,
        elements: data.elements ?? original.elements,
        extensions: data.extensions ?? original.extensions
    };
};

class UpdatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: UpdatePageRepository.Interface
    ) {}

    async execute(id: string, data: UseCaseAbstraction.UpdateData): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Get the original page for events
        const getResult = await this.getPageById.execute(id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canEdit = await this.permissions.canEdit("page", original);
        if (!canEdit) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Publish before update event. Handlers can edit `page`, and that object is what we save.
        const page = structuredClone(applyUpdate(original, data));
        const beforeEvent = new PageBeforeUpdateEvent({
            original,
            input: { id, data },
            page
        });

        await this.eventPublisher.publish(beforeEvent);

        const result = await this.repository.execute(id, {
            ...PageToEntryValuesMapper.toValues(page),
            location: page.location,
            system: data.system
        });

        if (result.isFail()) {
            return result;
        }

        // Publish after update event
        const afterEvent = new PageAfterUpdateEvent({
            original,
            input: { id, data },
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const UpdatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdatePageUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, UpdatePageRepository]
});
