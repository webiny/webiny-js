import { IAddOptions, IZipper, IZipperDoneResult, IZipperOnCb } from "./abstractions/Zipper";
import { IUpload } from "./abstractions/Upload";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { IArchiver } from "./abstractions/Archiver";
import stream, { Readable } from "stream";
import { ArchiverError, EntryData, ProgressData } from "archiver";

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
    public on(event: "pipe" | "unpipe", listener: (src: stream.Readable) => void): void;
    public on(event: "entry", listener: (entry: EntryData) => void): void;

    public on(event: any, callback: any): void {
        this.archiver.archiver.on(event, callback);
    }
}
