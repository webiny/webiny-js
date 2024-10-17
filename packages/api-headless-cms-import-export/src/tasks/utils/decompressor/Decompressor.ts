import type {
    IDecompressor,
    IDecompressorDecompressParams,
    IUnzipperFile
} from "./abstractions/Decompressor";
import type {
    IMultipartUploadFactory,
    IMultipartUploadHandlerAddResult,
    IUploadDoneResult
} from "~/tasks/utils/upload";
import type { Entry } from "unzipper";
import { PassThrough } from "stream";

export interface IDecompressorParamsUploadCreateFactory {
    (filename: string): IMultipartUploadFactory;
}

export interface IDecompressorParams {
    createUploadFactory: IDecompressorParamsUploadCreateFactory;
}

export class Decompressor implements IDecompressor {
    private readonly createUploadFactory: IDecompressorParamsUploadCreateFactory;

    public constructor(params: IDecompressorParams) {
        this.createUploadFactory = params.createUploadFactory;
    }
    /**
     * Should not be used with large files (> 10/20MB)
     */
    public async read(files: IUnzipperFile[], target: string): Promise<string> {
        const file = files.find(f => f.path === target);
        if (!file) {
            throw new Error(`File "${target}" not found in the compressed file.`);
        }

        const buffer = await file.buffer();

        return buffer.toString();
    }

    public async extract(params: IDecompressorDecompressParams): Promise<IUploadDoneResult> {
        const { source, target } = params;

        const factory = this.createUploadFactory(target);

        const multipartUpload = await factory.start();

        const promises: Promise<IMultipartUploadHandlerAddResult>[] = [];

        const localStream = new PassThrough({
            autoDestroy: true
        })
            .on("error", err => {
                console.log("Decompressor Local Stream Error", err);
                throw err;
            })
            .on("data", data => {
                const p = multipartUpload.add(data);
                promises.push(p);
            });

        let stream: Entry;
        try {
            stream = source.stream();
        } catch (ex) {
            console.error(`Failed to create stream for "${source.path}".`, ex);
            throw ex;
        }
        return new Promise<IUploadDoneResult>((resolve, reject) => {
            let alreadyDone = false;
            let alreadyError = false;

            const done = async (): Promise<void> => {
                if (alreadyDone) {
                    return;
                }
                alreadyDone = true;
                try {
                    await Promise.all(promises);
                    const result = await multipartUpload.complete();
                    resolve(result.result);
                } catch (ex) {
                    console.error("Failed to upload file.", ex);
                    multipartUpload.abort();
                    reject(ex);
                } finally {
                    stream.destroy();
                }
            };

            const error = async (err: Error): Promise<void> => {
                if (alreadyError) {
                    return;
                }
                alreadyError = true;
                try {
                    await multipartUpload.abort();
                    reject(err);
                } catch (ex) {
                    reject(ex);
                } finally {
                    stream.destroy();
                }
            };

            stream
                .pipe(localStream)
                .on("finish", () => {
                    done();
                })
                .on("error", err => {
                    error(err);
                });
        });
    }
}

export const createDecompressor = (params: IDecompressorParams): IDecompressor => {
    return new Decompressor(params);
};
