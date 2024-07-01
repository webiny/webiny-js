import { IGetRestoredItemUseCase } from "~/UseCases";
import { IGetRestoredItemByIdController } from "./IGetRestoredItemByIdController";
import { TrashBinItemMapper } from "~/Domain/Repositories/TrashBinItems/TrashBinItemMapper";

export class GetRestoredItemByIdController implements IGetRestoredItemByIdController {
    private readonly useCaseFactory: () => IGetRestoredItemUseCase;
    private itemMapper: TrashBinItemMapper;

    constructor(useCaseFactory: () => IGetRestoredItemUseCase) {
        this.useCaseFactory = useCaseFactory;
        this.itemMapper = new TrashBinItemMapper();
    }

    async execute(id: string) {
        const getRestoredItemUseCase = this.useCaseFactory();
        const item = await getRestoredItemUseCase.execute(id);
        return item ? this.itemMapper.toDTO(item) : undefined;
    }
}
