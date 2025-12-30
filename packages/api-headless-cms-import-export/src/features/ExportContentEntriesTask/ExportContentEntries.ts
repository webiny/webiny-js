import type { Context } from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { getErrorProperties } from "@webiny/tasks/utils/index.js";
import type { ICmsEntryZipper, ICmsEntryZipperConfig } from "~/tasks/utils/cmsEntryZipper/index.js";
import { CmsEntryZipperExecuteContinueResult } from "~/tasks/utils/cmsEntryZipper/index.js";
import type {
    IExportContentEntries,
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "~/tasks/domain/abstractions/ExportContentEntries.js";
import { createCmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/createCmsEntryFetcher.js";
import type { IContentEntryTraverser } from "@webiny/api-headless-cms";
import { WBY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IExportContentEntriesConfig {
    context: Context;
    createCmsEntryZipper(config: Pick<ICmsEntryZipperConfig, "fetcher">): ICmsEntryZipper;
}

export interface ICreateCmsEntryZipperConfig extends Pick<ICmsEntryZipperConfig, "fetcher"> {
    filename: string;
    model: Pick<CmsModel, "modelId">;
    traverser: IContentEntryTraverser;
}

export class ExportContentEntries<
    I extends IExportContentEntriesInput = IExportContentEntriesInput,
    O extends IExportContentEntriesOutput = IExportContentEntriesOutput
> implements IExportContentEntries<I, O>
{
    private readonly createCmsEntryZipper: (config: ICreateCmsEntryZipperConfig) => ICmsEntryZipper;
    private readonly context: Context;

    public constructor(config: IExportContentEntriesConfig) {
        this.context = config.context;
        this.createCmsEntryZipper = config.createCmsEntryZipper;
    }

    public async run(params: TaskDefinition.RunParams<I, O>) {
        const { input, controller } = params;

        const { prefix: basePrefix } = input;

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

        const prefix = `${basePrefix}/entries`;
        const fetcher = createCmsEntryFetcher(async after => {
            const input = {
                where: params.input.where,
                limit: params.input.limit || 100000,
                sort: params.input.sort,
                after
            };
            const [items, meta] = await this.context.cms.listLatestEntries(model, input);

            return {
                items,
                meta
            };
        });

        const filenamePrefix = [prefix, input.after].filter(Boolean).join("-");

        const filename = `${filenamePrefix}.${WBY_EXPORT_ENTRIES_EXTENSION}`;

        const traverser = await this.context.cms.getEntryTraverser(model.modelId);

        const entryZipper = this.createCmsEntryZipper({
            filename,
            model,
            fetcher,
            traverser
        });

        const result = await entryZipper.execute({
            isCloseToTimeout: () => controller.runtime.isCloseToTimeout(),
            isAborted: () => controller.runtime.isAborted(),
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
            return controller.response.continue({
                ...input,
                files,
                after: result.cursor
            });
        }
        const output: IExportContentEntriesOutput = {
            files
        };
        return controller.response.done(output as O);
    }
}
