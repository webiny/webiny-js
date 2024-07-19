import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { getErrorProperties } from "@webiny/tasks/utils";
import { ZipCombiner } from "~/tasks/utils/zipCombiner";
import {
    CmsEntryZipperExecuteContinueResult,
    ICmsEntryZipper,
    ICmsEntryZipperConfig
} from "~/tasks/utils/cmsEntryZipper";
import {
    IExportContentEntries,
    IExportContentEntriesInput,
    IExportContentEntriesOutput,
    IExportContentEntriesOutputFile
} from "~/tasks/domain/abstractions/ExportContentEntries";
import { createCmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/createCmsEntryFetcher";
import { IContentEntryTraverser } from "@webiny/api-headless-cms";
import {
    WEBINY_EXPORT_ENTRIES_EXTENSION,
    WEBINY_EXPORT_COMBINED_ENTRIES_EXTENSION
} from "~/tasks/constants";

export interface ICreateZipCombinerParams {
    target: string;
}

export interface IExportContentEntriesConfig {
    createCmsEntryZipper(config: Pick<ICmsEntryZipperConfig, "fetcher">): ICmsEntryZipper;
    createZipCombiner(config: ICreateZipCombinerParams): ZipCombiner;
}

export interface ICreateCmsEntryZipperConfig extends Pick<ICmsEntryZipperConfig, "fetcher"> {
    filename: string;
    model: Pick<CmsModel, "modelId">;
    traverser: IContentEntryTraverser;
}

export class ExportContentEntries<
    C extends Context = Context,
    I extends IExportContentEntriesInput = IExportContentEntriesInput,
    O extends IExportContentEntriesOutput = IExportContentEntriesOutput
> implements IExportContentEntries<C, I, O>
{
    private readonly createCmsEntryZipper: (config: ICreateCmsEntryZipperConfig) => ICmsEntryZipper;
    private readonly createZipCombiner: (config: ICreateZipCombinerParams) => ZipCombiner;

    public constructor(config: IExportContentEntriesConfig) {
        this.createCmsEntryZipper = config.createCmsEntryZipper;
        this.createZipCombiner = config.createZipCombiner;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, isCloseToTimeout, isAborted } = params;

        const { prefix: basePrefix } = input;

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
        /**
         * If we are combining files, we need to fetch the all the files and combine them.
         * TODO: determine if its possible to combine all the files which were created.
         */
        const prefix = `${basePrefix}/entries-batch-`;
        if (input.combine) {
            const lastFileProcessed = input.lastFileProcessed ? `-${input.lastFileProcessed}` : "";
            const combined = Array.from<IExportContentEntriesOutputFile>(
                Array.isArray(input.combined) ? input.combined : []
            );
            const zipCombiner = this.createZipCombiner({
                target: `${basePrefix}/entries${lastFileProcessed}.${WEBINY_EXPORT_COMBINED_ENTRIES_EXTENSION}`
            });

            const result = await zipCombiner.resolve({
                source: prefix,
                model,
                lastFileProcessed: input.lastFileProcessed,
                isAborted,
                isCloseToTimeout
            });

            combined.push({
                key: result.key
            });

            if (result.lastFileProcessed) {
                return response.continue({
                    ...input,
                    lastFileProcessed: result.lastFileProcessed,
                    combined
                });
            }

            return response.done("Successfully combined entry files.", {
                files: combined
            } as O);
        }
        /**
         * If we are not combining files, we need to fetch the next batch of entries and zip them.
         */
        const fetcher = createCmsEntryFetcher(async after => {
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

        const filename = `${prefix}${input.after || "0"}.${WEBINY_EXPORT_ENTRIES_EXTENSION}`;

        const traverser = await context.cms.getEntryTraverser(model.modelId);

        const entryZipper = this.createCmsEntryZipper({
            filename,
            model,
            fetcher,
            traverser
        });

        const result = await entryZipper.execute({
            isCloseToTimeout,
            isAborted,
            model,
            after: input.after,
            exportAssets: input.exportAssets
        });
        if (result instanceof CmsEntryZipperExecuteContinueResult) {
            return response.continue({
                ...input,
                after: result.cursor
            });
        }
        return response.continue({
            ...input,
            after: undefined,
            combine: true
        });
    }
}
