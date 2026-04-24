import type {
    IImportFromUrlProcessEntriesInsert,
    IImportFromUrlProcessEntriesInsertRunParams,
    IImportFromUrlProcessEntriesInsertRunResult
} from "./abstractions/ImportFromUrlProcessEntriesInsert.js";
import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesInsertProcessedFileErrorsInput,
    IImportFromUrlProcessEntriesInsertProcessedFileInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries.js";
import { MANIFEST_JSON } from "~/tasks/constants.js";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher/index.js";
import type { ICmsEntryEntriesJson } from "~/tasks/utils/types.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IImportFromUrlProcessEntriesInsertParams {
    model: CmsModel;
    createEntry: CreateEntryUseCase.Interface;
    fileFetcher: IFileFetcher;
}

export class ImportFromUrlProcessEntriesInsert<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntriesInsert<I, O> {
    private readonly createEntry: CreateEntryUseCase.Interface;
    private readonly fileFetcher: IFileFetcher;
    private readonly model: CmsModel;

    public constructor(params: IImportFromUrlProcessEntriesInsertParams) {
        this.model = params.model;
        this.createEntry = params.createEntry;
        this.fileFetcher = params.fileFetcher;
    }

    public async run(
        params: IImportFromUrlProcessEntriesInsertRunParams<I, O>
    ): Promise<IImportFromUrlProcessEntriesInsertRunResult<I, O>> {
        const { input, controller } = params;

        const result = structuredClone(input);

        const files = (result.decompress?.files || []).filter(
            file => !file.endsWith(MANIFEST_JSON)
        );
        if (files.length === 0) {
            return controller.response.error({
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
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            } else if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue({
                    ...result
                });
            }
            const file = this.takeFile(files, result.insert?.file);
            if (!file) {
                const output: IImportFromUrlProcessEntriesOutput = {
                    files: processed
                };

                return controller.response.done(output as O);
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
                    return controller.response.error({
                        message: `Max insert errors reached.`,
                        code: "MAX_INSERT_ERRORS",
                        data: {
                            errors
                        }
                    });
                }

                const createResult = await this.createEntry.execute(this.model, {
                    ...item,
                    values: item
                });

                if (createResult.isFail()) {
                    console.error(`Failed to insert entry "${item.id}"`, createResult.error);
                    errors.push({
                        id: item.id,
                        message: createResult.error.message
                    });
                } else {
                    success++;
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
        } catch {
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
