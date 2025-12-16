import type { Context } from "~/types.js";
import type {
    IExportContentAssets,
    IExportContentAssetsInput,
    IExportContentAssetsOutput
} from "~/tasks/domain/abstractions/ExportContentAssets.js";
import type { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/index.js";
import { createCmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/index.js";
import type { IEntryAssets, IEntryAssetsResolver } from "~/tasks/utils/entryAssets/index.js";
import { EntryAssets, EntryAssetsResolver } from "~/tasks/utils/entryAssets/index.js";
import type {
    ICmsAssetsZipper,
    ICmsAssetsZipperExecuteResult
} from "~/tasks/utils/cmsAssetsZipper/index.js";
import {
    CmsAssetsZipperExecuteContinueResult,
    CmsAssetsZipperExecuteContinueWithoutResult,
    CmsAssetsZipperExecuteDoneResult,
    CmsAssetsZipperExecuteDoneWithoutResult
} from "~/tasks/utils/cmsAssetsZipper/index.js";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher/index.js";
import { FileFetcher } from "~/tasks/utils/fileFetcher/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { getErrorProperties } from "@webiny/tasks/utils/index.js";
import { getBucket } from "~/tasks/utils/helpers/getBucket.js";
import { createS3Client } from "~/tasks/utils/helpers/s3Client.js";
import { UniqueResolver } from "~/tasks/utils/uniqueResolver/UniqueResolver.js";
import { WEBINY_EXPORT_ASSETS_EXTENSION } from "~/tasks/constants.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ICreateCmsAssetsZipperCallableConfig {
    filename: string;
    entryFetcher: ICmsEntryFetcher;
    createEntryAssets: () => IEntryAssets;
    createEntryAssetsResolver: () => IEntryAssetsResolver;
    fileFetcher: IFileFetcher;
}

export interface ICreateCmsAssetsZipperCallable {
    (config: ICreateCmsAssetsZipperCallableConfig): ICmsAssetsZipper;
}

const getFilename = (input: IExportContentAssetsInput): string => {
    const current = [input.entryAfter, input.fileAfter]
        .filter(item => item !== undefined)
        .join("-");

    return `${input.prefix}/assets${
        current ? `-${current}` : ""
    }.${WEBINY_EXPORT_ASSETS_EXTENSION}`;
};

export interface IExportContentAssetsParams {
    context: Context;
    createCmsAssetsZipper: ICreateCmsAssetsZipperCallable;
}

export class ExportContentAssets<
    I extends IExportContentAssetsInput = IExportContentAssetsInput,
    O extends IExportContentAssetsOutput = IExportContentAssetsOutput
> implements IExportContentAssets<I, O>
{
    private readonly createCmsAssetsZipper: ICreateCmsAssetsZipperCallable;
    private context: Context;

    public constructor(params: IExportContentAssetsParams) {
        this.context = params.context;
        this.createCmsAssetsZipper = params.createCmsAssetsZipper;
    }

    public async run(params: TaskDefinition.RunParams<I, O>) {
        const { input, controller } = params;

        let model: CmsModel;
        try {
            model = await this.context.cms.getModel(input.modelId);
        } catch (ex) {
            return controller.response.error({
                message: `Could not fetch entry manager for model "${input.modelId}".`,
                code: "MODEL_NOT_FOUND",
                data: {
                    error: getErrorProperties(ex)
                }
            });
        }

        const traverser = await this.context.cms.getEntryTraverser(model.modelId);

        const entryFetcher = createCmsEntryFetcher(async after => {
            const input = {
                where: params.input.where,
                limit: params.input.limit || 10000,
                sort: params.input.sort,
                after
            };
            const [items, meta] = await this.context.cms.listLatestEntries(model, input);

            return {
                items,
                meta
            };
        });

        const fileFetcher = new FileFetcher({
            client: createS3Client(),
            bucket: getBucket()
        });

        const filename = getFilename(input);

        const zipper = this.createCmsAssetsZipper({
            filename,
            fileFetcher,
            entryFetcher,
            createEntryAssets: () => {
                return new EntryAssets({
                    traverser,
                    uniqueResolver: new UniqueResolver()
                });
            },
            createEntryAssetsResolver: () => {
                return new EntryAssetsResolver({
                    fetchFiles: async params => {
                        const listFiles = this.context.container.resolve(ListFilesUseCase);
                        const listResult = await listFiles.execute(params ?? {});

                        return listResult.value;
                    }
                });
            }
        });

        let result: ICmsAssetsZipperExecuteResult;

        try {
            result = await zipper.execute({
                fileAfter: input.fileAfter,
                entryAfter: input.entryAfter,
                isAborted() {
                    return controller.runtime.isAborted();
                },
                isCloseToTimeout(seconds?: number) {
                    return controller.runtime.isCloseToTimeout(seconds);
                }
            });
        } catch (ex) {
            return controller.response.error(ex);
        }

        const files = Array.isArray(input.files) ? input.files : [];
        /**
         * Zipper is done, but there is no result?
         * We will output existing input files.
         */
        if (result instanceof CmsAssetsZipperExecuteDoneWithoutResult) {
            return controller.response.done({
                files
            } as O);
        }
        /**
         * Zipper is done and there is a result?
         * We will output existing input files and the new file.
         */
        //
        else if (result instanceof CmsAssetsZipperExecuteDoneResult) {
            return controller.response.done({
                files: files.concat([
                    {
                        key: result.key,
                        checksum: result.checksum
                    }
                ])
            } as O);
        }
        /**
         * Zipper is not done and there is no result?
         * Let's continue with the next iteration.
         */
        //
        else if (result instanceof CmsAssetsZipperExecuteContinueWithoutResult) {
            return controller.response.continue({
                ...input,
                fileAfter: result.fileCursor,
                entryAfter: result.entryCursor
            });
        }
        /**
         * Zipper is not done and there is a result?
         * Let's merge the existing files with the new file and continue with the next iteration.
         */
        //
        else if (result instanceof CmsAssetsZipperExecuteContinueResult) {
            return controller.response.continue({
                ...input,
                fileAfter: result.fileCursor,
                entryAfter: result.entryCursor,
                files: files.concat([
                    {
                        key: result.key,
                        checksum: result.checksum
                    }
                ])
            });
        }

        return controller.response.error({
            message: "Unknown zipper result.",
            code: "UNKNOWN_ZIPPER_RESULT",
            data: {
                type: typeof result,
                constructor: result?.constructor?.name || "unknown constructor",
                result
            }
        });
    }
}
