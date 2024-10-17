import type { ArchiverError, EntryData, ProgressData } from "archiver";
import type { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import type { Readable } from "stream";

export interface IAddOptions extends Omit<EntryData, "name">, Required<Pick<EntryData, "name">> {}

export interface IZipperOnCb {
    (...args: any[]): void;
}

export type IZipperDoneResult = CompleteMultipartUploadCommandOutput;

export interface IZipper {
    add(data: Buffer | Readable, options: IAddOptions): Promise<void>;
    on(event: string, cb: IZipperOnCb): void;
    on(event: "error" | "warning", listener: (error: ArchiverError) => void): void;
    on(event: "data", listener: (data: Buffer) => void): void;
    on(event: "progress", listener: (progress: ProgressData) => void): void;
    on(event: "close" | "drain" | "finish", listener: () => void): void;
    on(event: "pipe" | "unpipe", listener: (src: Readable) => void): void;
    on(event: "entry", listener: (entry: EntryData) => void): void;
    finalize(): Promise<void>;
    abort(): Promise<void>;
    done(): Promise<IZipperDoneResult>;
}
