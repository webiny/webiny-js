import {
    IExportContentEntries,
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "./abstractions/ExportContentEntries";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { getErrorProperties } from "@webiny/tasks/utils";
import { S3Client } from "~/tasks/utils/S3Client";
import { PassThrough } from "stream";
import uniqueId from "uniqid";
import { Zipper } from "../utils/Zipper";
import { Upload } from "../utils/Upload";
import { CmsEntryZipper, ICmsEntryFetcher } from "~/tasks/utils/CmsEntryZipper";
import vending from "archiver";

export class ExportContentEntries<
    C extends Context = Context,
    I extends IExportContentEntriesInput = IExportContentEntriesInput,
    O extends IExportContentEntriesOutput = IExportContentEntriesOutput
> implements IExportContentEntries<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, isCloseToTimeout, isAborted } = params;

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

        const fetcher: ICmsEntryFetcher = async after => {
            const [items, meta] = await context.cms.listLatestEntries(model, {
                where: params.input.where,
                limit: 1000,
                sort: params.input.sort,
                after
            });
            return {
                items,
                meta
            };
        };

        const s3Client = new S3Client();
        const streamPassThrough = new PassThrough({
            autoDestroy: true
        });

        const filename = uniqueId(`cms-export/${model.modelId}/`, "entries.zip");

        const upload = new Upload({
            client: s3Client,
            filename,
            bucket: process.env.S3_BUCKET as string,
            stream: streamPassThrough
        });

        const archiver = vending.create("zip", {
            gzip: true
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        const entryZipper = new CmsEntryZipper({
            zipper,
            fetcher,
            archiver
        });

        await entryZipper.execute({
            shouldAbort: () => {
                return isCloseToTimeout() || isAborted();
            }
        });

        return response.done();
    }
}
