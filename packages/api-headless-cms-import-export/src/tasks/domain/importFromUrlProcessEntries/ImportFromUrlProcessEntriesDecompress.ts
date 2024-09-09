import { createDecompressor } from "~/tasks/utils/decompressor";
import {
    IImportFromUrlProcessEntriesDecompress,
    IImportFromUrlProcessEntriesDecompressRunParams,
    IImportFromUrlProcessEntriesDecompressRunResult
} from "./abstractions/ImportFromUrlProcessEntriesDecompress";
import { S3Client } from "@webiny/aws-sdk/client-s3";
import {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries";
import { CompressedFileReader } from "~/tasks/utils/decompressor/CompressedFileReader";
import { getFilePath } from "~/tasks/utils/helpers/getFilePath";
import { Context } from "~/types";
import { createUploadFactory } from "~/tasks/utils/upload";
import { WebinyError } from "@webiny/error";

export interface IImportFromUrlProcessEntriesDecompressParams {
    client: S3Client;
    bucket: string;
}

export class ImportFromUrlProcessEntriesDecompress<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntriesDecompress<C, I, O>
{
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: IImportFromUrlProcessEntriesDecompressParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async run(
        params: IImportFromUrlProcessEntriesDecompressRunParams<C, I, O>
    ): Promise<IImportFromUrlProcessEntriesDecompressRunResult<I, O>> {
        const { response, input, isCloseToTimeout, isAborted } = params;
        const result = structuredClone<I>(input);

        const reader = new CompressedFileReader({
            client: this.client,
            bucket: this.bucket
        });

        const files = await reader.read(result.file.key);
        if (files.length === 0) {
            return response.error({
                message: `No files found in the compressed archive.`,
                code: "NO_FILES_FOUND"
            });
        }

        const createUpload = createUploadFactory({
            client: this.client,
            bucket: this.bucket
        });

        const decompressor = createDecompressor({
            createUpload
        });

        const extractPath = getFilePath(result.file.key);

        while (true) {
            const next = result.decompress?.next || 0;
            const source = files.at(next);
            if (!source) {
                return response.continue({
                    ...result,
                    decompress: {
                        ...result.decompress,
                        done: true
                    }
                });
            } else if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout() || result.decompress?.done) {
                return response.continue({
                    ...result
                });
            }
            try {
                const target = `${extractPath.path}/extracted/${source.path}`;
                const file = await decompressor.extract({
                    source,
                    target
                });
                if (!file.Key) {
                    throw new WebinyError({
                        message: `Could not upload the file "${source.path}".`,
                        code: "FILE_NOT_UPLOAD",
                        data: {
                            source: source.path,
                            target
                        }
                    });
                }
                result.decompress = {
                    ...result.decompress,
                    next: next + 1,
                    files: [...(result.decompress?.files || []), target]
                };
            } catch (ex) {
                return response.error(ex);
            }
        }
    }
}
