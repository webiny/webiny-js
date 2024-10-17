import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import type { Context } from "~/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { getErrorProperties } from "@webiny/tasks/utils";
import type { ICmsEntryZipper, ICmsEntryZipperConfig } from "~/tasks/utils/cmsEntryZipper";
import { CmsEntryZipperExecuteContinueResult } from "~/tasks/utils/cmsEntryZipper";
import type {
    IExportContentEntries,
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "~/tasks/domain/abstractions/ExportContentEntries";
import { createCmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/createCmsEntryFetcher";
import type { IContentEntryTraverser } from "@webiny/api-headless-cms";
import { WEBINY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants";

export interface IExportContentEntriesConfig {
    createCmsEntryZipper(config: Pick<ICmsEntryZipperConfig, "fetcher">): ICmsEntryZipper;
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

    public constructor(config: IExportContentEntriesConfig) {
        this.createCmsEntryZipper = config.createCmsEntryZipper;
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

        const prefix = `${basePrefix}/entries`;
        const fetcher = createCmsEntryFetcher(async after => {
            const input = {
                where: params.input.where,
                limit: params.input.limit || 100000,
                sort: params.input.sort,
                after
            };
            const [items, meta] = await context.cms.listLatestEntries(model, input);

            return {
                items,
                meta
            };
        });

        const filenamePrefix = [prefix, input.after].filter(Boolean).join("-");

        const filename = `${filenamePrefix}.${WEBINY_EXPORT_ENTRIES_EXTENSION}`;

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

        const files = (input.files || []).concat([
            {
                key: result.key,
                checksum: result.checksum
            }
        ]);

        if (result instanceof CmsEntryZipperExecuteContinueResult) {
            return response.continue({
                ...input,
                files,
                after: result.cursor
            });
        }
        const output: IExportContentEntriesOutput = {
            files
        };
        return response.done(output as O);
    }
}
