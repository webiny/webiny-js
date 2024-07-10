import { CmsEntry, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { IUrlSigner } from "~/tasks/utils/urlSigner";
import { IFileMeta } from "../types";
import { CmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult";
import { CmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult";
import {
    ICmsEntryZipper,
    ICmsEntryZipperExecuteParams,
    ICmsEntryZipperExecuteResult
} from "./abstractions/CmsEntryZipper";
import { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/abstractions/CmsEntryFetcher";
import { IZipper } from "~/tasks/utils/zipper";
import { IAsset, IEntryAssets } from "~/tasks/utils/entryAssets";
import { IUniqueResolver } from "~/tasks/utils/uniqueResolver/abstractions/UniqueResolver";

export interface ICmsEntryZipperConfig {
    zipper: IZipper;
    urlSigner: IUrlSigner;
    fetcher: ICmsEntryFetcher;
    entryAssets: IEntryAssets;
    uniqueAssetsResolver: IUniqueResolver<IAsset>;
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

export class CmsEntryZipper implements ICmsEntryZipper {
    private readonly zipper: IZipper;
    private readonly urlSigner: IUrlSigner;
    private readonly fetcher: ICmsEntryFetcher;
    private readonly entryAssets: IEntryAssets;
    private readonly uniqueAssetsResolver: IUniqueResolver<IAsset>;

    public constructor(params: ICmsEntryZipperConfig) {
        this.zipper = params.zipper;
        this.urlSigner = params.urlSigner;
        this.fetcher = params.fetcher;
        this.entryAssets = params.entryAssets;
        this.uniqueAssetsResolver = params.uniqueAssetsResolver;
    }

    public async execute(
        params: ICmsEntryZipperExecuteParams
    ): Promise<ICmsEntryZipperExecuteResult> {
        const { isCloseToTimeout, isAborted, model, after: inputAfter, exportAssets } = params;

        const files: IFileMeta[] = [];

        let after = inputAfter;

        let hasMoreItems = true;
        let storedFiles = false;

        let id = 1;

        let continueAfter: string | undefined = undefined;

        let assets: IAsset[] | undefined = undefined;
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
                            assets,
                            exportedAssets: exportAssets || false,
                            model
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
            /**
             * We should not continue if assets are getting exported.
             * There will be a new task triggered for exporting assets.
             */
            if (exportAssets) {
                return;
            } else if (!assets) {
                assets = [];
            }

            const itemsAssets = this.entryAssets.assignAssets(items);

            if (itemsAssets.length === 0) {
                return;
            }
            const uniqueItemAssets = this.uniqueAssetsResolver.resolve(itemsAssets, "url");
            if (uniqueItemAssets.length === 0) {
                return;
            }
            assets.push(...uniqueItemAssets);
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

        const { url, bucket, key, expiresOn } = await this.urlSigner.sign({
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
