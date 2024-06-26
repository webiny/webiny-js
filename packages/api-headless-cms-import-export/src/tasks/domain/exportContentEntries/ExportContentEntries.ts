import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { getErrorProperties } from "@webiny/tasks/utils";
import { ZipCombiner } from "~/tasks/utils/zipCombiner";
import {
    CmsEntryZipperExecuteContinueResult,
    ICmsEntryFetcher,
    ICmsEntryZipper,
    ICmsEntryZipperConfig
} from "~/tasks/utils/cmsEntryZipper";
import {
    IExportContentEntries,
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "~/tasks/domain/abstractions/ExportContentEntries";

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

        const prefix = `${basePrefix}/entries/batch-`;
        if (input.combine) {
            const next = input.next ? `-${input.next}` : "";
            const combined: string[] = Array.from(input.combined || []);
            const zipCombiner = this.createZipCombiner({
                target: `${basePrefix}/entries${next}.zip`
            });

            const result = await zipCombiner.resolve({
                source: prefix,
                isAborted,
                isCloseToTimeout
            });

            combined.push(result.url);

            if (result.next) {
                return response.continue({
                    ...input,
                    next: result.next,
                    combined
                });
            }

            return response.done("Successfully combined entry files.", {
                files: combined,
                expiresOn: result.expiresOn
            } as O);
        }

        const fetcher: ICmsEntryFetcher = async after => {
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
        };

        const filename = `${prefix}${input.after || "0"}.zip`;

        const entryZipper = this.createCmsEntryZipper({
            filename,
            model,
            fetcher
        });

        const result = await entryZipper.execute({
            isCloseToTimeout,
            isAborted,
            model
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
