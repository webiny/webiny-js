import {
    IDecompressor,
    IDecompressorDecompressParams,
    UnzipperFile
} from "./abstractions/Decompressor";
import { ICreateUploadCallable, IUploadDoneResult } from "~/tasks/utils/upload";

export interface IDecompressorParams {
    createUpload: ICreateUploadCallable;
}

export class Decompressor implements IDecompressor {
    private readonly createUpload: ICreateUploadCallable;

    public constructor(params: IDecompressorParams) {
        this.createUpload = params.createUpload;
    }
    /**
     * Should not be used with large files (> 10/20MB)
     */
    public async read(files: UnzipperFile[], target: string): Promise<string> {
        const file = files.find(f => f.path === target);
        if (!file) {
            throw new Error(`File "${target}" not found in the compressed file.`);
        }

        const buffer = await file.buffer();

        return buffer.toString();
    }

    public async extract(params: IDecompressorDecompressParams): Promise<IUploadDoneResult> {
        const { source, target } = params;

        const upload = this.createUpload(target);

        return new Promise<IUploadDoneResult>((resolve, reject) => {
            source
                .stream()
                .pipe(upload.stream)
                .on("finish", () => {
                    upload.done().then(resolve);
                })
                .on("error", () => {
                    upload.abort().then(reject);
                });
        });
    }
}

export const createDecompressor = (params: IDecompressorParams) => {
    return new Decompressor(params);
};
