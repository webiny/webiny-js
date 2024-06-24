import { IArchiver } from "./abstractions/Archiver";
import vending, { Archiver as BaseArchiver, ArchiverOptions } from "archiver";

export interface IArchiverConfig {
    format?: "zip";
    options: ArchiverOptions;
}

export class Archiver implements IArchiver {
    public readonly archiver: BaseArchiver;

    public constructor(config: IArchiverConfig) {
        this.archiver = vending.create(config.format || "zip", config.options);
    }
}
