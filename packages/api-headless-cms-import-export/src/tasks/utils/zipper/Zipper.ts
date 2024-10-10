import type { IAddOptions, IZipper, IZipperDoneResult } from "./abstractions/Zipper";
import type { Readable } from "stream";
import type { ArchiverError, EntryData, ProgressData } from "archiver";
import type { IUpload } from "~/tasks/utils/upload";
import type { IArchiver } from "~/tasks/utils/archiver";

export interface IZipperConfig {
    upload: IUpload;
    archiver: IArchiver;
}

export class Zipper implements IZipper {
    private readonly upload: IUpload;
    public readonly archiver: IArchiver;

    public constructor(config: IZipperConfig) {
        this.upload = config.upload;
        this.archiver = config.archiver;

        this.archiver.archiver.pipe(config.upload.stream);
    }

    public async add(data: Buffer | Readable, options: IAddOptions): Promise<void> {
        this.archiver.archiver.append(data, options);
    }

    public async finalize(): Promise<void> {
        /**
         * Unfortunately we must wait a bit before finalizing the archive.
         * Possibly it could work without this, but I've seen some issues with the archiver hanging if the finalize
         * was called immediately after the last file was added.
         */
        setTimeout(() => {
            this.archiver.archiver.finalize();
        }, 200);
    }

    public async abort(): Promise<void> {
        return this.upload.abort();
    }

    public async done(): Promise<IZipperDoneResult> {
        return this.upload.done();
    }

    public on(event: "error" | "warning", listener: (error: ArchiverError) => void): void;
    public on(event: "data", listener: (data: Buffer) => void): void;
    public on(event: "progress", listener: (progress: ProgressData) => void): void;
    public on(event: "close" | "drain" | "finish", listener: () => void): void;
    public on(event: "pipe" | "unpipe", listener: (src: Readable) => void): void;
    public on(event: "entry", listener: (entry: EntryData) => void): void;

    public on(event: any, callback: any): void {
        this.archiver.archiver.on(event, callback);
    }
}
