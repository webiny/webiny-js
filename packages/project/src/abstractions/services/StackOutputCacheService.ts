import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";

export interface IStackOutputCacheService {
    read(app: IAppModel): Promise<Record<string, any> | null>;
    write(app: IAppModel, data: Record<string, any>): Promise<void>;
    delete(app: IAppModel): Promise<void>;
}

export const StackOutputCacheService =
    createAbstraction<IStackOutputCacheService>("StackOutputCacheService");

export namespace StackOutputCacheService {
    export type Interface = IStackOutputCacheService;
}
