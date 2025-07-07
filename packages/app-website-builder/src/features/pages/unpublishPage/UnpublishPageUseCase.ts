import { Page } from "~/features/pages/Page.js";
import type {
    IUnpublishPageUseCase,
    UnpublishPageParams
} from "~/features/pages/unpublishPage/IUnpublishPageUseCase.js";
import type { IUnpublishPageRepository } from "~/features/pages/unpublishPage/IUnpublishPageRepository.js";

export class UnpublishPageUseCase implements IUnpublishPageUseCase {
    private repository: IUnpublishPageRepository;

    constructor(repository: IUnpublishPageRepository) {
        this.repository = repository;
    }

    async execute(params: UnpublishPageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id,
                entryId: params.entryId
            })
        );
    }
}
