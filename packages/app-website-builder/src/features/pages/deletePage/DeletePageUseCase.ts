import type {
    DeletePageParams,
    IDeletePageUseCase
} from "~/features/pages/deletePage/IDeletePageUseCase.js";
import type { IDeletePageRepository } from "~/features/pages/deletePage/IDeletePageRepository.js";
import { Page } from "~/domain/Page/index.js";

export class DeletePageUseCase implements IDeletePageUseCase {
    private repository: IDeletePageRepository;

    constructor(repository: IDeletePageRepository) {
        this.repository = repository;
    }

    async execute(params: DeletePageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id
            })
        );
    }
}
