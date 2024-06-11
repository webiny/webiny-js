import uniqueId from "uniqid";
import {
    IExportContentEntries,
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "./abstractions/ExportContentEntries";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { getErrorProperties } from "@webiny/tasks/utils";
import { PassThrough, StreamOptions } from "stream";
import { IZipperConfig, Zipper } from "../utils/Zipper";
import { IUploadConfig, Upload } from "../utils/Upload";
import {
    CmsEntryZipper,
    ICmsEntryFetcher,
    ICmsEntryZipperConfig
} from "~/tasks/utils/CmsEntryZipper";
import { Archiver, IArchiverConfig } from "../utils/Archiver";
import { ICmsEntryZipper } from "../utils/abstractions/CmsEntryZipper";
import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { NodeHttpHandler } from "@smithy/node-http-handler";

export interface IExportContentEntriesConfig {
    createCmsEntryZipper(config: Pick<ICmsEntryZipperConfig, "fetcher">): ICmsEntryZipper;
}

export interface ICreateCmsEntryZipperConfig extends Pick<ICmsEntryZipperConfig, "fetcher"> {
    filename: string;
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
                limit: 10000,
                sort: params.input.sort,
                after
            });

            return {
                items,
                meta
            };
        };

        const filename = uniqueId(`cms-export/${model.modelId}/`, "entries.zip");

        const entryZipper = this.createCmsEntryZipper({
            filename,
            fetcher
        });

        const shouldAbort = (): boolean => {
            return isCloseToTimeout() || isAborted();
        };

        await entryZipper.execute({
            shouldAbort
        });

        return response.done();
    }
}

export const createExportContentEntries = () => {
    const createPassThrough = (config: StreamOptions<PassThrough>) => {
        return new PassThrough(config);
    };

    const createUpload = (config: IUploadConfig) => {
        return new Upload(config);
    };

    const createZipper = (config: IZipperConfig) => {
        return new Zipper(config);
    };

    const createArchiver = (config: IArchiverConfig) => {
        return new Archiver(config);
    };

    const createCmsEntryZipper = (config: ICreateCmsEntryZipperConfig) => {
        const s3Client = createS3Client({
            requestHandler: new NodeHttpHandler({
                connectionTimeout: 0,
                httpAgent: new HttpAgent({
                    maxSockets: 10000,
                    keepAlive: true,
                    maxFreeSockets: 10000,
                    maxTotalSockets: 10000,
                    keepAliveMsecs: 900000 // milliseconds / 15 minutes
                }),
                httpsAgent: new HttpsAgent({
                    maxSockets: 10000,
                    keepAlive: true,
                    sessionTimeout: 900, // seconds / 15 minutes
                    maxCachedSessions: 100000,
                    maxFreeSockets: 10000,
                    maxTotalSockets: 10000,
                    keepAliveMsecs: 900000 // milliseconds / 15 minutes
                }),
                requestTimeout: 900000 // milliseconds / 15 minutes
            })
        });
        const streamPassThrough = createPassThrough({
            autoDestroy: true
        });

        const upload = createUpload({
            client: s3Client,
            filename: config.filename,
            bucket: process.env.S3_BUCKET as string,
            stream: streamPassThrough
        });

        const archiver = createArchiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        const zipper = createZipper({
            upload,
            archiver
        });

        return new CmsEntryZipper({
            fetcher: config.fetcher,
            archiver,
            zipper
        });
    };

    return new ExportContentEntries({
        createCmsEntryZipper
    });
};
