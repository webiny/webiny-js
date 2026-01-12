import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";

export interface IPulumiImportService {
    execute(app: IAppModel, state: Record<string, any>): Promise<void>;
}

export const PulumiImportService = createAbstraction<IPulumiImportService>("PulumiImportService");

export namespace PulumiImportService {
    export type Interface = IPulumiImportService;
}
