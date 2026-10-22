import { Result, createImplementation } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { DuplicatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PageBeforeDuplicateEvent, PageAfterDuplicateEvent } from "./events.js";
import { createDuplicatePageData } from "./createDuplicatePageData.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class DuplicatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private createPage: CreatePageUseCase.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        // Publish before duplicate event
        const beforeEvent = new PageBeforeDuplicateEvent({
            original
        });

        await this.eventPublisher.publish(beforeEvent);

        // The duplicate is a brand-new page, so it goes through the regular create flow (and its events).
        const result = await this.createPage.execute(createDuplicatePageData(original));

        if (result.isFail()) {
            return result;
        }

        // Publish after duplicate event
        const afterEvent = new PageAfterDuplicateEvent({
            original,
            page: result.value
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(result.value);
    }
}

export const DuplicatePageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DuplicatePageUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, GetPageByIdUseCase, CreatePageUseCase]
});
