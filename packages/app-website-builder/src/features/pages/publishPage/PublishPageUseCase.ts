import { Page } from "~/features/pages/Page.js";
import type {
    IPublishPageUseCase,
    PublishPageParams
} from "~/features/pages/publishPage/IPublishPageUseCase.js";
import type { IPublishPageRepository } from "~/features/pages/publishPage/IPublishPageRepository.js";

export class PublishPageUseCase implements IPublishPageUseCase {
    private repository: IPublishPageRepository;

    constructor(repository: IPublishPageRepository) {
        this.repository = repository;
    }

    async execute(params: PublishPageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id,
                entryId: params.id,
                status: params.status,
                location: params.location,
                properties: params.properties,
                bindings: params.bindings,
                elements: params.elements,
                extensions: params.extensions
            })
        );
    }
}
