import { EntryData } from "archiver";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";

export interface IAddOptions extends Omit<EntryData, "name">, Required<Pick<EntryData, "name">> {}

export interface IZipper {
    add(data: Buffer, options: IAddOptions): Promise<void>;
    finalize(): Promise<void>;
    abort(): Promise<void>;
    done(): Promise<CompleteMultipartUploadCommandOutput>;
}
