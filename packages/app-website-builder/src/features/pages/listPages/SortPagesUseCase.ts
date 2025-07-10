import type {
    ISortPagesUseCase,
    SortPagesUseCaseParams
} from "~/features/pages/listPages/ISortPagesUseCase.js";
import { ISortingRepository, SortingMapper } from "@webiny/app-utils";
import { IListPagesRepository } from "~/features/pages/listPages/IListPagesRepository.js";

export class SortPagesUseCase implements ISortPagesUseCase {
    private listPagesRepository: IListPagesRepository;
    private sortingRepository: ISortingRepository;

    constructor(listPagesRepository: IListPagesRepository, sortingRepository: ISortingRepository) {
        this.listPagesRepository = listPagesRepository;
        this.sortingRepository = sortingRepository;
    }

    public execute = async (params: SortPagesUseCaseParams) => {
        this.sortingRepository.set(params.sorts);
        const sort = this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        console.log("this.sort", sort);
        await this.listPagesRepository.execute({ sort });
    };
}
