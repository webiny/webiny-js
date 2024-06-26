import { EntryData } from "archiver";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { Readable } from "stream";

export interface IAddOptions extends Omit<EntryData, "name">, Required<Pick<EntryData, "name">> {}

export interface IZipperOnCb {
    (...args: any[]): void;
}

export interface IZipper {
    add(data: Buffer | Readable, options: IAddOptions): Promise<void>;
    on(event: string, cb: IZipperOnCb): void;
    finalize(): Promise<void>;
    abort(): Promise<void>;
    done(): Promise<CompleteMultipartUploadCommandOutput>;
}
