import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks/types";
import type {
    IImportFromUrlProcessAssets,
    IImportFromUrlProcessAssetsInput,
    IImportFromUrlProcessAssetsOutput
} from "~/tasks/domain/importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets";
import { CmsImportExportFileType, Context } from "~/types";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher";
import type {
    ICompressedFileReader,
    IDecompressor,
    IUnzipperFile
} from "~/tasks/utils/decompressor";
import { MANIFEST_JSON } from "~/tasks/constants";
import { getFilePath } from "~/tasks/utils/helpers/getFilePath";
import { WebinyError } from "@webiny/error";
import type { ICmsAssetsManifestJson } from "~/tasks/utils/types";
import type { IResolvedAsset } from "~/tasks/utils/entryAssets";

export interface IImportFromUrlProcessAssetsParams {
    fileFetcher: IFileFetcher;
    reader: ICompressedFileReader;
    decompressor: IDecompressor;
}

export class ImportFromUrlProcessAssets<
    C extends Context = Context,
    I extends IImportFromUrlProcessAssetsInput = IImportFromUrlProcessAssetsInput,
    O extends IImportFromUrlProcessAssetsOutput = IImportFromUrlProcessAssetsOutput
> implements IImportFromUrlProcessAssets<C, I, O>
{
    private readonly fileFetcher: IFileFetcher;
    private readonly reader: ICompressedFileReader;
    private readonly decompressor: IDecompressor;

    public constructor(params: IImportFromUrlProcessAssetsParams) {
        this.fileFetcher = params.fileFetcher;
        this.reader = params.reader;
        this.decompressor = params.decompressor;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, isCloseToTimeout, isAborted } = params;

        const maxInsertErrors = input.maxInsertErrors || 100;

        if (!input.modelId) {
            return response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (!input.file) {
            return response.error({
                message: `No file found in the provided data.`,
                code: "NO_FILE_FOUND"
            });
        } else if (input.file.type !== CmsImportExportFileType.ASSETS) {
            return response.error({
                message: `Invalid file type. Expected "${CmsImportExportFileType.ASSETS}" but got "${input.file.type}".`,
                code: "INVALID_FILE_TYPE"
            });
        }

        const recordExists = async (id: string): Promise<boolean> => {
            try {
                const result = await context.fileManager.getFile(id);
                return !!result;
            } catch (ex) {
                return false;
            }
        };

        const result = structuredClone({
            ...input,
            errors: []
        });
        /**
         * Read the compressed archive and get all the file information.
         */
        const sources = await this.reader.read(result.file.key);
        if (sources.length === 0) {
            return response.error({
                message: `No files found in the compressed archive.`,
                code: "NO_FILES_FOUND"
            });
        }

        /**
         * Read the manifest file.
         * Should not be possible it does not exist, but let's handle it anyway.
         */
        let manifest: ICmsAssetsManifestJson;
        try {
            manifest = await this.readManifest(sources, result);
        } catch (ex) {
            console.error(ex);
            return response.error(ex);
        }

        while (true) {
            if (isCloseToTimeout()) {
                return response.continue(result);
            } else if (isAborted()) {
                return response.aborted();
            } else if (result.errors.length > maxInsertErrors) {
                return response.error({
                    message: `Too many errors encountered while processing assets.`,
                    code: "TOO_MANY_ERRORS",
                    data: {
                        errors: result.errors
                    }
                });
            }
            const record = this.takeNextAssetRecord(manifest, result.lastAsset);
            if (!record) {
                return response.done("No more assets to process");
            }
            result.lastAsset = record.id;
            const source = sources.find(file => file.path === record.key);
            if (!source) {
                result.errors.push({
                    file: record.key,
                    message: `File not found in the compressed archive.`
                });
                continue;
            }
            /**
             * Check if the file exists physically.
             */
            const existsPhysically = await this.fileFetcher.exists(source.path);
            if (existsPhysically && !input.override) {
                console.log(
                    `Asset "${record.id}" / ${source.path} file already exists. Skipping...`
                );
                continue;
            }
            /**
             * Check if the file record already exists.
             */
            const exists = await recordExists(record.id);
            if (exists && !input.override) {
                console.log(
                    `Asset "${record.id}" / ${source.path} record already exists. Skipping...`
                );
                continue;
            }
            /**
             * Upload the file to the S3 bucket, if it does not exist already.
             */
            if (!existsPhysically) {
                try {
                    const file = await this.decompressor.extract({
                        source,
                        target: record.key
                    });
                    if (!file?.Key) {
                        result.errors.push({
                            file: record.key,
                            message: `Could not upload the file "${source.path}" to "${record.key}".`
                        });
                        continue;
                    }
                } catch (ex) {
                    result.errors.push({
                        file: record.key,
                        message: ex.message
                    });
                    continue;
                }
            }
            /**
             * Update an existing file record.
             */
            if (exists) {
                try {
                    await context.fileManager.updateFile(record.id, {
                        ...record
                    });
                } catch (ex) {
                    result.errors.push({
                        file: record.key,
                        message: ex.message
                    });
                }
                continue;
            }
            /**
             * Create a new file record.
             */
            try {
                await context.fileManager.createFile({
                    ...record,
                    id: record.id,
                    key: record.key,
                    size: record.size,
                    type: record.type,
                    name: record.name,
                    meta: record.meta,
                    aliases: record.aliases,
                    extensions: record.extensions,
                    location: record.location,
                    tags: record.tags
                });
            } catch (ex) {
                result.errors.push({
                    file: record.key,
                    message: ex.message
                });
            }
        }
    }

    private async readManifest(
        sources: IUnzipperFile[],
        input: I
    ): Promise<ICmsAssetsManifestJson> {
        let manifest: string | undefined = input?.manifest;

        if (!manifest) {
            const extractPath = getFilePath(input.file.key);
            const source = sources.find(file => file.path === MANIFEST_JSON);
            if (!source) {
                throw new WebinyError({
                    message: `No manifest file found in the compressed archive.`,
                    code: "NO_MANIFEST_FILE"
                });
            }
            const target = `extracted/${extractPath.path}/${source.path}`;
            try {
                const file = await this.decompressor.extract({
                    source,
                    target
                });
                if (!file.Key) {
                    throw new Error(`Could not upload the file "${source.path}" to "${target}".`);
                }
                manifest = file.Key;
            } catch (ex) {
                throw new WebinyError({
                    message: ex.message,
                    code: "MANIFEST_DECOMPRESS_FAILED"
                });
            }
        }

        let file: string | null;
        try {
            file = await this.fileFetcher.read(manifest);
            if (!file) {
                throw new WebinyError({
                    message: `Could not fetch the manifest file "${manifest}".`,
                    code: "MANIFEST_NOT_FOUND"
                });
            }
        } catch (ex) {
            throw new WebinyError({
                message: ex.message,
                code: "MANIFEST_FETCH_FAILED",
                data: ex
            });
        }

        let json: ICmsAssetsManifestJson;
        try {
            json = JSON.parse(file);
        } catch (ex) {
            throw new WebinyError({
                message: ex.message,
                code: "MANIFEST_PARSE_FAILED",
                data: ex
            });
        }
        if (!json.assets?.length) {
            throw new WebinyError({
                message: `Invalid manifest file "${manifest}". Missing "assets" property.`,
                code: "INVALID_MANIFEST_FILE"
            });
        } else if (!json.size) {
            throw new WebinyError({
                message: `Invalid manifest file "${manifest}". Missing "size" property.`,
                code: "INVALID_MANIFEST_FILE"
            });
        }
        return json;
    }

    private takeNextAssetRecord(
        manifest: ICmsAssetsManifestJson,
        lastAsset: string | undefined
    ): IResolvedAsset | null {
        if (!lastAsset) {
            return manifest.assets[0] as IResolvedAsset;
        }
        const lastIndex = manifest.assets.findIndex(asset => asset.id === lastAsset);
        if (lastIndex === -1) {
            return null;
        }
        const asset = manifest.assets[lastIndex + 1];
        return asset || null;
    }
}
