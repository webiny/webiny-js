import type { IMoveRedirectRepository } from "~/features/redirects/moveRedirect/IMoveRedirectRepository.js";
import type {
    IMoveRedirectUseCase,
    MoveRedirectParams
} from "~/features/redirects/moveRedirect/IMoveRedirectUseCase.js";

export class MoveRedirectUseCase implements IMoveRedirectUseCase {
    private repository: IMoveRedirectRepository;

    constructor(repository: IMoveRedirectRepository) {
        this.repository = repository;
    }

    async execute(params: MoveRedirectParams) {
        await this.repository.execute(params.id, params.folderId);
    }
}
