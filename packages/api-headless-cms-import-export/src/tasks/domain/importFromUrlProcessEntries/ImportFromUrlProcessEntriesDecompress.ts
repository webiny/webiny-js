import type { ICompressedFileReader, IDecompressor } from "~/tasks/utils/decompressor";
import type {
    IImportFromUrlProcessEntriesDecompress,
    IImportFromUrlProcessEntriesDecompressRunParams,
    IImportFromUrlProcessEntriesDecompressRunResult
} from "./abstractions/ImportFromUrlProcessEntriesDecompress";
import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries";
import { getFilePath } from "~/tasks/utils/helpers/getFilePath";
import type { Context } from "~/types";
import { WebinyError } from "@webiny/error";

export interface IImportFromUrlProcessEntriesDecompressParams {
    reader: ICompressedFileReader;
    decompressor: IDecompressor;
}

export class ImportFromUrlProcessEntriesDecompress<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntriesDecompress<C, I, O>
{
    private readonly reader: ICompressedFileReader;
    private readonly decompressor: IDecompressor;

    public constructor(params: IImportFromUrlProcessEntriesDecompressParams) {
        this.reader = params.reader;
        this.decompressor = params.decompressor;
    }

    public async run(
        params: IImportFromUrlProcessEntriesDecompressRunParams<C, I, O>
    ): Promise<IImportFromUrlProcessEntriesDecompressRunResult<I, O>> {
        const { response, input, isCloseToTimeout, isAborted } = params;
        const result = structuredClone<I>(input);

        const files = (await this.reader.read(result.file.key)).sort((a, b) => {
            return a.uncompressedSize - b.uncompressedSize;
        });
        if (files.length === 0) {
            return response.error({
                message: `No files found in the compressed archive.`,
                code: "NO_FILES_FOUND"
            });
        }

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
                const target = `extracted/${extractPath.path}/${source.path}`;
                const file = await this.decompressor.extract({
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
                    files: [...(result.decompress?.files || []), file.Key]
                };
            } catch (ex) {
                return response.error(ex);
            }
        }
    }
}
