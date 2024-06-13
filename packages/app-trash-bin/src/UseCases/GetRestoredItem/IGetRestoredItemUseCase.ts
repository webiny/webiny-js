import { TrashBinItem } from "~/Domain";

export interface IGetRestoredItemUseCase {
    execute: (id: string) => Promise<TrashBinItem | undefined>;
}
