import { CmsEntry, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { IZipper } from "../abstractions/Zipper";
import { ISignUrl } from "~/tasks/utils/abstractions/SignedUrl";
import { IFileMeta } from "../types";
import { CmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult";
import { CmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult";
import {
    ICmsEntryZipper,
    ICmsEntryZipperExecuteParams,
    ICmsEntryZipperExecuteResult
} from "./abstractions/CmsEntryZipper";

export interface ICmsEntryZipperConfig {
    zipper: IZipper;
    signUrl: ISignUrl;
    fetcher: ICmsEntryFetcher;
}

interface ICreateBufferDataParams {
    items: CmsEntry[];
    meta: CmsEntryMeta;
    after?: string;
}

const createBufferData = (params: ICreateBufferDataParams) => {
    const { items, meta, after } = params;
    return Buffer.from(
        JSON.stringify({
            items,
            meta,
            after
        })
    );
};

export interface ICmsEntryFetcherResult {
    items: CmsEntry[];
    meta: CmsEntryMeta;
}

export interface ICmsEntryFetcher {
    (after?: string): Promise<ICmsEntryFetcherResult>;
}

export class CmsEntryZipper implements ICmsEntryZipper {
    private readonly zipper: IZipper;
    private readonly signUrl: ISignUrl;
    private readonly fetcher: ICmsEntryFetcher;

    public constructor(params: ICmsEntryZipperConfig) {
        this.zipper = params.zipper;
        this.signUrl = params.signUrl;
        this.fetcher = params.fetcher;
    }

    public async execute(
        params: ICmsEntryZipperExecuteParams
    ): Promise<ICmsEntryZipperExecuteResult> {
        const { isCloseToTimeout, isAborted, model, after: inputAfter } = params;

        const files: IFileMeta[] = [];

        let after = inputAfter;

        let hasMoreItems = true;
        let storedFiles = false;

        let id = 1;

        let continueAfter: string | undefined = undefined;
        /**
         * This function works as self invoking function, it will add items to the zipper until there are no more items to add.
         *
         * If the lambda is close to timeout, we will store the current state and continue from the last cursor in the next task run.
         */
        const addItems = async () => {
            if (isAborted()) {
                this.zipper.abort();
                return;
            }
            const closeToTimeout = isCloseToTimeout();
            if (storedFiles) {
                await this.zipper.finalize();
                return;
            } else if (!hasMoreItems || closeToTimeout) {
                if (closeToTimeout && hasMoreItems) {
                    continueAfter = after;
                }
                await this.zipper.add(
                    Buffer.from(
                        JSON.stringify({
                            files,
                            modelId: model.modelId
                        })
                    ),
                    {
                        name: "manifest.json"
                    }
                );
                storedFiles = true;
                return;
            }

            const { items, meta } = await this.fetcher(after);
            if (meta.totalCount === 0) {
                console.log("No items found, aborting...");
                this.zipper.abort();
                return;
            }

            const name = `entries${inputAfter ? `-${inputAfter}` : ""}-${id}.json`;

            files.push({
                id,
                name,
                after
            });

            await this.zipper.add(createBufferData({ items, meta, after }), {
                name
            });

            hasMoreItems = meta.hasMoreItems;
            after = meta.cursor || undefined;

            id++;
        };

        this.zipper.on("error", error => {
            console.error(error);
        });

        this.zipper.on("entry", () => {
            addItems();
        });

        addItems();

        const result = await this.zipper.done();

        if (!result.Key) {
            throw new Error("Failed to upload the file.");
        }

        if (continueAfter) {
            return new CmsEntryZipperExecuteContinueResult({
                key: result.Key,
                cursor: continueAfter
            });
        }

        const { url, bucket, key, expiresOn } = await this.signUrl.fetch({
            key: result.Key
        });

        return new CmsEntryZipperExecuteDoneResult({
            key,
            url,
            bucket,
            expiresOn
        });
    }
}
