import { IArchiver } from "./abstractions/Archiver";
import vending, { Archiver as BaseArchiver, ArchiverOptions } from "archiver";

export interface IArchiverConfig {
    format: "zip" | "tar";
    options: ArchiverOptions;
}

export class Archiver implements IArchiver {
    public readonly archiver: BaseArchiver;

    public constructor(config: IArchiverConfig) {
        this.archiver = vending.create(config.format, config.options);
    }
}
