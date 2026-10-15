import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreatePageRevisionFromUseCase as UseCaseAbstraction,
    CreatePageRevisionFromRepository
} from "./abstractions.js";
import { PageBeforeCreateRevisionFromEvent, PageAfterCreateRevisionFromEvent } from "./events.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { PageToEntryValuesMapper } from "~/domain/page/PageToEntryValuesMapper.js";

class CreatePageRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: CreatePageRevisionFromRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Verify ownership of the source page
        const getResult = await this.getPageById.execute(params.id);
        if (getResult.isFail()) {
            return getResult;
        }

        // Publish before event
        const original = getResult.value;
        const beforeEvent = new PageBeforeCreateRevisionFromEvent({
            params,
            original,
            input: { id: params.id, data: PageToEntryValuesMapper.toValues(original) }
        });

        await this.eventPublisher.publish(beforeEvent);

        // Create the revision with the data as the handlers left it.
        const result = await this.repository.execute({
            id: params.id,
            values: beforeEvent.payload.input.data
        });

        if (result.isFail()) {
            return result;
        }

        const page = result.value;

        // Publish after event
        const afterEvent = new PageAfterCreateRevisionFromEvent({
            page
        });

        await this.eventPublisher.publish(afterEvent);

        return Result.ok(page);
    }
}

export const CreatePageRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreatePageRevisionFromUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetPageByIdUseCase,
        CreatePageRevisionFromRepository
    ]
});
