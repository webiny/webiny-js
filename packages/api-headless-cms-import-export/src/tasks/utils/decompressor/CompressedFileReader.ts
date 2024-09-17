import { Open } from "unzipper";
import { S3Client } from "../helpers/s3Client";
import { UnzipperFile } from "./abstractions/Decompressor";
import { ICompressedFileReader } from "./abstractions/CompressedFileReader";

export interface ICompressedFileReaderParams {
    client: S3Client;
    bucket: string;
}

export class CompressedFileReader implements ICompressedFileReader {
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: ICompressedFileReaderParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async read(target: string): Promise<UnzipperFile[]> {
        const result = await Open.s3_v3(this.client, {
            Bucket: this.bucket,
            Key: target
        });
        return result.files.filter(file => {
            return file.type === "File";
        });
    }
}

export const createCompressedFileReader = (
    params: ICompressedFileReaderParams
): ICompressedFileReader => {
    return new CompressedFileReader(params);
};
