import { IZipper } from "~/tasks/utils/zipper";
import {
    IZipCombiner,
    IZipCombinerResolveParams,
    IZipCombinerResolveResult
} from "./abstractions/ZipCombiner";
import { IFileFetcher, IFileFetcherFile } from "~/tasks/utils/fileFetcher";
import { sanitizeModel } from "@webiny/api-headless-cms/export/crud/sanitize";
import { CmsImportExportFileType } from "~/types";
import { stripExportPath } from "../helpers/exportPath";

interface IFetchFilesParams {
    source: string;
    /**
     * There is a possibility to start from a specific file.
     */
    after?: string;
}

export interface IZipCombinerParams {
    fileFetcher: IFileFetcher;
    zipper: IZipper;
}

export class ZipCombiner implements IZipCombiner {
    private readonly fileFetcher: IFileFetcher;
    private readonly zipper: IZipper;

    public constructor(params: IZipCombinerParams) {
        this.fileFetcher = params.fileFetcher;
        this.zipper = params.zipper;
    }

    public async resolve(params: IZipCombinerResolveParams): Promise<IZipCombinerResolveResult> {
        const { source, isCloseToTimeout, isAborted, lastFileProcessed: after, model } = params;

        const files = await this.fetchFiles({
            source,
            after
        });
        if (files.length === 0) {
            throw new Error(`No files found in with prefix "${source}".`);
        }

        const allFiles = Array.from(files);

        const addedFiles: IFileFetcherFile[] = [];

        let lastFileProcessed: string | undefined = undefined;

        let finalize = false;

        const addFile = async (): Promise<void> => {
            /**
             * If task is aborted, abort the zipper.
             */
            if (isAborted()) {
                this.zipper.abort();
                return;
            }
            /**
             * In case finalize was requested, finalize the zipper.
             */
            //
            else if (finalize) {
                if (addedFiles.length === 0) {
                    console.error(`No files were added to the zip. Cannot finalize.`);
                    console.error(
                        `But there were ${allFiles.length} found via the fetcher target "${source}".`
                    );
                    this.zipper.abort();
                    return;
                }

                await this.zipper.finalize();
                return;
            }
            /**
             * In case we are close to timeout, finalize the zipper.
             * We will finalize current file and return the point from which the files get processed on next run.
             */
            //
            const file = files.shift();
            if (isCloseToTimeout() || !file) {
                lastFileProcessed = file?.key;
                await this.zipper.add(
                    Buffer.from(
                        JSON.stringify({
                            files: addedFiles,
                            model: sanitizeModel(
                                {
                                    id: model.group.id
                                },
                                model
                            ),
                            type: CmsImportExportFileType.COMBINED_ENTRIES
                        })
                    ),
                    {
                        name: "manifest.json"
                    }
                );
                finalize = true;
                return;
            }

            const result = await this.fileFetcher.fetch(file.key);
            if (!result) {
                console.error(`Failed to fetch file "${file.key}".`);
                addFile();
                return;
            }
            await this.zipper.add(result, {
                name: file.name
            });
            addedFiles.push(file);
        };

        this.zipper.on("entry", () => {
            addFile();
        });

        /**
         * Unfortunately we need timeout because of the possible abort signal immediately on the first addFile() call.
         * If that happens, the zipper.done() promise hangs...
         */
        setTimeout(() => {
            addFile();
        }, 100);

        const result = await this.zipper.done();
        if (!result.Key || !result.ETag) {
            throw new Error(`Failed to combine files with prefix "${source}".`);
        }

        return {
            lastFileProcessed,
            key: stripExportPath(result.Key),
            checksum: result.ETag.replaceAll('"', "")
        };
    }

    private async fetchFiles(params: IFetchFilesParams): Promise<IFileFetcherFile[]> {
        const { source, after } = params;
        const fetchedFiles = await this.fileFetcher.list(source);
        if (!after) {
            return fetchedFiles;
        }
        const index = fetchedFiles.findIndex(file => file.key === after);
        if (index === -1) {
            const message = `Failed to find file "${after}" in the list of files.`;
            console.error(message);
            throw new Error(message);
        }

        return fetchedFiles.slice(index + 1);
    }
}
