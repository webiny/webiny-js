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
import {
    CmsEntryZipper,
    ICmsEntryFetcher,
    ICmsEntryZipperConfig
} from "~/tasks/utils/CmsEntryZipper";
import {
    Archiver,
    IArchiverConfig,
    IUploadConfig,
    IZipperConfig,
    Upload,
    Zipper
} from "~/tasks/utils";
import { ICmsEntryZipper } from "../utils/abstractions/CmsEntryZipper";
import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { EntryAssets } from "~/tasks/utils/EntryAssets";
import { EntryAssetsList } from "~/tasks/utils/EntryAssetsList";
import { SignedUrl } from "~/tasks/utils/SignedUrl";
import { getBucket } from "~/tasks/utils/helpers/getBucket";

export interface IExportContentEntriesConfig {
    createCmsEntryZipper(
        config: Pick<ICmsEntryZipperConfig, "fetcher" | "entryAssets" | "entryAssetsList">
    ): ICmsEntryZipper;
}

export interface ICreateCmsEntryZipperConfig
    extends Pick<ICmsEntryZipperConfig, "fetcher" | "entryAssets" | "entryAssetsList"> {
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
            const input = {
                where: params.input.where,
                limit: 10000,
                sort: params.input.sort,
                after
            };
            const [items, meta] = await context.cms.listLatestEntries(model, input);
            return {
                items,
                meta
            };
        };

        const prefix = uniqueId(`cms-export/${model.modelId}/`);
        const filename = `${prefix}/entries.zip`;

        const traverser = await context.cms.getEntryTraverser(model.modelId);
        const entryAssets = new EntryAssets({
            traverser
        });

        const entryAssetsList = new EntryAssetsList({
            listFiles: opts => {
                return context.fileManager.listFiles(opts);
            }
        });

        const entryZipper = this.createCmsEntryZipper({
            filename,
            fetcher,
            entryAssets,
            entryAssetsList
        });

        const shouldAbort = (): boolean => {
            return isCloseToTimeout() || isAborted();
        };

        const result = await entryZipper.execute({
            shouldAbort,
            model
        });
        if (!result.key || !result.url) {
            return response.error({
                message: "Failed to export content entries.",
                code: "EXPORT_FAILED"
            });
        }

        // unfortunately we need to cast as TS thinks this is a bug.
        // TODO: pass proper types to response.done callable
        return response.done({
            file: result.key,
            url: result.url
        } as O);
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
        const client = createS3Client({
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
        const stream = createPassThrough({
            autoDestroy: true
        });

        const bucket = getBucket();

        const upload = createUpload({
            client,
            filename: config.filename,
            bucket,
            stream
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

        const signedUrl = new SignedUrl({
            client,
            bucket
        });

        return new CmsEntryZipper({
            fetcher: config.fetcher,
            signedUrl,
            archiver,
            zipper,
            entryAssets: config.entryAssets,
            entryAssetsList: config.entryAssetsList
        });
    };

    return new ExportContentEntries({
        createCmsEntryZipper
    });
};
