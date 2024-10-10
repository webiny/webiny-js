import type { Context } from "~/types";
import type {
    IExportContentAssets,
    IExportContentAssetsInput,
    IExportContentAssetsOutput
} from "~/tasks/domain/abstractions/ExportContentAssets";
import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import type { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher";
import { createCmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher";
import type { IEntryAssets, IEntryAssetsResolver } from "~/tasks/utils/entryAssets";
import { EntryAssets, EntryAssetsResolver } from "~/tasks/utils/entryAssets";
import type {
    ICmsAssetsZipper,
    ICmsAssetsZipperExecuteResult
} from "~/tasks/utils/cmsAssetsZipper";
import {
    CmsAssetsZipperExecuteContinueResult,
    CmsAssetsZipperExecuteContinueWithoutResult,
    CmsAssetsZipperExecuteDoneResult,
    CmsAssetsZipperExecuteDoneWithoutResult
} from "~/tasks/utils/cmsAssetsZipper";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher";
import { FileFetcher } from "~/tasks/utils/fileFetcher";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { getErrorProperties } from "@webiny/tasks/utils";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { UniqueResolver } from "~/tasks/utils/uniqueResolver/UniqueResolver";
import { WEBINY_EXPORT_ASSETS_EXTENSION } from "~/tasks/constants";

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
    createCmsAssetsZipper: ICreateCmsAssetsZipperCallable;
}

export class ExportContentAssets<
    C extends Context = Context,
    I extends IExportContentAssetsInput = IExportContentAssetsInput,
    O extends IExportContentAssetsOutput = IExportContentAssetsOutput
> implements IExportContentAssets<C, I, O>
{
    private readonly createCmsAssetsZipper: ICreateCmsAssetsZipperCallable;

    public constructor(params: IExportContentAssetsParams) {
        this.createCmsAssetsZipper = params.createCmsAssetsZipper;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response, context, input, isCloseToTimeout, isAborted } = params;

        let model: CmsModel;
        try {
            model = await context.cms.getModel(input.modelId);
        } catch (ex) {
            return response.error({
                message: `Could not fetch entry manager for model "${input.modelId}".`,
                code: "MODEL_NOT_FOUND",
                data: {
                    error: getErrorProperties(ex)
                }
            });
        }

        const traverser = await context.cms.getEntryTraverser(model.modelId);

        const entryFetcher = createCmsEntryFetcher(async after => {
            const input = {
                where: params.input.where,
                limit: params.input.limit || 10000,
                sort: params.input.sort,
                after
            };
            const [items, meta] = await context.cms.listLatestEntries(model, input);

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
                        const [items, meta] = await context.fileManager.listFiles(params);
                        return {
                            items,
                            meta
                        };
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
                    return isAborted();
                },
                isCloseToTimeout(seconds?: number) {
                    return isCloseToTimeout(seconds);
                }
            });
        } catch (ex) {
            return response.error(ex);
        }

        const files = Array.isArray(input.files) ? input.files : [];
        /**
         * Zipper is done, but there is no result?
         * We will output existing input files.
         */
        if (result instanceof CmsAssetsZipperExecuteDoneWithoutResult) {
            return response.done({
                files
            } as O);
        }
        /**
         * Zipper is done and there is a result?
         * We will output existing input files and the new file.
         */
        //
        else if (result instanceof CmsAssetsZipperExecuteDoneResult) {
            return response.done({
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
            return response.continue({
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
            return response.continue({
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

        return response.error({
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
