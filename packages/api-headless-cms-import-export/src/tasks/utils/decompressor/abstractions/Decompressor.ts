import type { IUploadDoneResult } from "~/tasks/utils/upload";
import type { File as IUnzipperFile } from "unzipper";

export type { IUnzipperFile };

export interface IDecompressorDecompressParams {
    source: IUnzipperFile;
    target: string;
}

export interface IDecompressor {
    read(files: IUnzipperFile[], target: string): Promise<string>;
    extract(params: IDecompressorDecompressParams): Promise<IUploadDoneResult>;
}
