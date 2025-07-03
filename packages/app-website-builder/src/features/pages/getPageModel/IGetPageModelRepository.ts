import { PageModelDto } from "./PageModelDto.js";

export interface IGetPageModelRepository {
    load: () => Promise<void>;
    getModel: () => PageModelDto | undefined;
    hasModel: () => boolean;
}
