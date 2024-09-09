import { IUploadDoneResult } from "~/tasks/utils/upload";
import { File as UnzipperFile } from "unzipper";

export type { UnzipperFile };

export interface IDecompressorDecompressParams {
    source: UnzipperFile;
    target: string;
}

export interface IDecompressor {
    read(files: UnzipperFile[], target: string): Promise<string>;
    extract(params: IDecompressorDecompressParams): Promise<IUploadDoneResult>;
}
