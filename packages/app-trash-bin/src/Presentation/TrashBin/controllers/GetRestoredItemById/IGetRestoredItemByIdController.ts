import { TrashBinItemDTO } from "~/Domain";

export interface IGetRestoredItemByIdController {
    execute(id: string): Promise<TrashBinItemDTO | undefined>;
}
