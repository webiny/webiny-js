import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreateLayoutRevisionFromRepository,
    CreateLayoutRevisionFromUseCase as UseCaseAbstraction
} from "./abstractions.js";
import {
    LayoutAfterCreateRevisionFromEvent,
    LayoutBeforeCreateRevisionFromEvent
} from "./events.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";

class CreateLayoutRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private repository: CreateLayoutRevisionFromRepository.Interface
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

        await this.eventPublisher.publish(new LayoutBeforeCreateRevisionFromEvent({ original }));

        const result = await this.repository.execute(original.id);
        if (result.isFail()) {
            return result;
        }

        // A new draft revision doesn't change which revision is published.
        const layout = { ...result.value, live: original.live };

        await this.eventPublisher.publish(
            new LayoutAfterCreateRevisionFromEvent({ original, layout })
        );

        return Result.ok(layout);
    }
}

export const CreateLayoutRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateLayoutRevisionFromUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutRepository,
        CreateLayoutRevisionFromRepository
    ]
});
