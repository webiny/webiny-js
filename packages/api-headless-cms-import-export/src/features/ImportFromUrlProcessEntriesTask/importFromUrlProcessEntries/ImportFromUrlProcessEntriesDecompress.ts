import type { ICompressedFileReader, IDecompressor } from "~/tasks/utils/decompressor/index.js";
import type {
    IImportFromUrlProcessEntriesDecompress,
    IImportFromUrlProcessEntriesDecompressRunParams,
    IImportFromUrlProcessEntriesDecompressRunResult
} from "./abstractions/ImportFromUrlProcessEntriesDecompress.js";
import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries.js";
import { getFilePath } from "~/tasks/utils/helpers/getFilePath.js";
import { WebinyError } from "@webiny/error";

export interface IImportFromUrlProcessEntriesDecompressParams {
    reader: ICompressedFileReader;
    decompressor: IDecompressor;
}

export class ImportFromUrlProcessEntriesDecompress<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntriesDecompress<I, O> {
    private readonly reader: ICompressedFileReader;
    private readonly decompressor: IDecompressor;

    public constructor(params: IImportFromUrlProcessEntriesDecompressParams) {
        this.reader = params.reader;
        this.decompressor = params.decompressor;
    }

    public async run(
        params: IImportFromUrlProcessEntriesDecompressRunParams<I, O>
    ): Promise<IImportFromUrlProcessEntriesDecompressRunResult<I, O>> {
        const { input, controller } = params;
        const result = structuredClone<I>(input);

        const files = (await this.reader.read(result.file.key)).sort((a, b) => {
            return a.uncompressedSize - b.uncompressedSize;
        });
        if (files.length === 0) {
            return controller.response.error({
                message: `No files found in the compressed archive.`,
                code: "NO_FILES_FOUND"
            });
        }

        const extractPath = getFilePath(result.file.key);

        while (true) {
            const next = result.decompress?.next || 0;
            const source = files.at(next);
            if (!source) {
                return controller.response.continue({
                    ...result,
                    decompress: {
                        ...result.decompress,
                        done: true
                    }
                });
            } else if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            } else if (controller.runtime.isCloseToTimeout() || result.decompress?.done) {
                return controller.response.continue({
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
                return controller.response.error(ex);
            }
        }
    }
}
