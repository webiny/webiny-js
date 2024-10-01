import type {
    IImportFromUrlProcessEntriesInsert,
    IImportFromUrlProcessEntriesInsertRunParams,
    IImportFromUrlProcessEntriesInsertRunResult
} from "./abstractions/ImportFromUrlProcessEntriesInsert";
import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesInsertProcessedFileErrorsInput,
    IImportFromUrlProcessEntriesInsertProcessedFileInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries";
import type { ICmsEntryManager } from "@webiny/api-headless-cms/types";
import type { Context } from "~/types";
import { MANIFEST_JSON } from "~/tasks/constants";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher";
import type { ICmsEntryEntriesJson } from "~/tasks/utils/types";

export interface IImportFromUrlProcessEntriesInsertParams {
    entryManager: ICmsEntryManager;
    fileFetcher: IFileFetcher;
}

export class ImportFromUrlProcessEntriesInsert<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntriesInsert<C, I, O>
{
    private readonly entryManager: ICmsEntryManager;
    private readonly fileFetcher: IFileFetcher;

    public constructor(params: IImportFromUrlProcessEntriesInsertParams) {
        this.entryManager = params.entryManager;
        this.fileFetcher = params.fileFetcher;
    }

    public async run(
        params: IImportFromUrlProcessEntriesInsertRunParams<C, I, O>
    ): Promise<IImportFromUrlProcessEntriesInsertRunResult<I, O>> {
        const { response, input, isAborted, isCloseToTimeout } = params;

        const result = structuredClone(input);

        const files = (result.decompress?.files || []).filter(
            file => !file.endsWith(MANIFEST_JSON)
        );
        if (files.length === 0) {
            return response.error({
                message: `No entry files found in the compressed archive.`,
                code: "NO_FILES_FOUND",
                data: {
                    files: result.decompress?.files || []
                }
            });
        }

        const maxInsertErrors = result.maxInsertErrors || 10;

        const processed: IImportFromUrlProcessEntriesInsertProcessedFileInput[] =
            result.insert?.processed || [];

        while (true) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...result
                });
            }
            const file = this.takeFile(files, result.insert?.file);
            if (!file) {
                const output: IImportFromUrlProcessEntriesOutput = {
                    files: processed
                };

                return response.done(output as O);
            }
            const data = await this.readAndParse(file, result);
            if (!data) {
                result.insert = {
                    ...result.insert,
                    file: this.takeNextFile(files, file),
                    failed: [
                        ...(result.insert?.failed || []),
                        {
                            key: file,
                            message: `Failed to read and parse the file. Please check logs for more detailed information.`
                        }
                    ]
                };
                continue;
            }
            const errors: IImportFromUrlProcessEntriesInsertProcessedFileErrorsInput[] = [];

            let success = 0;
            for (const item of data.items) {
                if (errors.length >= maxInsertErrors) {
                    return response.error({
                        message: `Max insert errors reached.`,
                        code: "MAX_INSERT_ERRORS",
                        data: {
                            errors
                        }
                    });
                }
                try {
                    await this.entryManager.create(item);
                    success++;
                } catch (ex) {
                    console.error(`Failed to insert entry "${item.id}"`, ex);
                    errors.push({
                        id: item.id,
                        message: ex.message
                    });
                }
            }
            processed.push({
                key: file,
                success,
                total: data.items.length,
                errors
            });
            result.insert = {
                ...result.insert,
                file: this.takeNextFile(files, file),
                processed
            };
        }
    }
    /**
     * Method reads and parses the target file.
     * In case of any error, it will log it, attach to the result parameter and return null.
     */
    private async readAndParse(key: string, result: I): Promise<ICmsEntryEntriesJson | null> {
        const data = await this.fileFetcher.read(key);
        if (!data) {
            const message = `No contents found for file "${key}".`;
            console.error(message);
            result.insert = {
                ...result.insert,
                failed: [
                    ...(result.insert?.failed || []),
                    {
                        key,
                        message
                    }
                ]
            };
            return null;
        }
        let parsed: Partial<ICmsEntryEntriesJson>;
        try {
            parsed = JSON.parse(data);
        } catch (ex) {
            const message = `Failed to parse JSON for file "${key}".`;
            console.error(message);
            result.insert = {
                ...result.insert,
                failed: [
                    ...(result.insert?.failed || []),
                    {
                        key,
                        message
                    }
                ]
            };
            return null;
        }
        if (!parsed.items) {
            const message = `Missing "items" in the parsed JSON for file "${key}".`;
            console.error(message);
            result.insert = {
                ...result.insert,
                failed: [
                    ...(result.insert?.failed || []),
                    {
                        key,
                        message
                    }
                ]
            };
            return null;
        }
        return parsed as ICmsEntryEntriesJson;
    }

    private takeFile(files: string[], last?: string): string | undefined {
        if (!last) {
            return files[0];
        }
        return files.find(file => file === last);
    }

    private takeNextFile(files: string[], last: string): string | undefined {
        const index = files.indexOf(last);
        if (index < 0) {
            return `notFound:${last}`;
        }
        const next = files.at(index + 1);
        if (next) {
            return next;
        }

        return `completedWith:${last}`;
    }
}
