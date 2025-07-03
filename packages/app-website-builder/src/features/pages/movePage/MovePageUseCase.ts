import type { IMovePageRepository } from "~/features/pages/movePage/IMovePageRepository.js";
import type {
    IMovePageUseCase,
    MovePageParams
} from "~/features/pages/movePage/IMovePageUseCase.js";

export class MovePageUseCase implements IMovePageUseCase {
    private repository: IMovePageRepository;

    constructor(repository: IMovePageRepository) {
        this.repository = repository;
    }

    async execute(params: MovePageParams) {
        await this.repository.execute(params.id, params.folderId);
    }
}
