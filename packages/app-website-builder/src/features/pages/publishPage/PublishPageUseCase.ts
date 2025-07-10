import type {
    IPublishPageUseCase,
    PublishPageParams
} from "~/features/pages/publishPage/IPublishPageUseCase.js";
import type { IPublishPageRepository } from "~/features/pages/publishPage/IPublishPageRepository.js";
import { Page } from "~/domain/Page/index.js";

export class PublishPageUseCase implements IPublishPageUseCase {
    private repository: IPublishPageRepository;

    constructor(repository: IPublishPageRepository) {
        this.repository = repository;
    }

    async execute(params: PublishPageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id
            })
        );
    }
}
