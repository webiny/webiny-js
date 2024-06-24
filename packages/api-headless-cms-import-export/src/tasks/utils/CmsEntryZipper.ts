import { CmsEntry, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { IZipper } from "./abstractions/Zipper";
import {
    ICmsEntryZipper,
    ICmsEntryZipperExecuteParams,
    ICmsEntryZipperExecuteResult
} from "~/tasks/utils/abstractions/CmsEntryZipper";
import { IFileMeta } from "./types";
import { IEntryAssets } from "~/tasks/utils/abstractions/EntryAssets";
import { IEntryAssetsList } from "~/tasks/utils/abstractions/EntryAssetsList";
import { ISignUrl } from "./abstractions/SignedUrl";

export interface ICmsEntryZipperConfig {
    zipper: IZipper;
    signUrl: ISignUrl;
    fetcher: ICmsEntryFetcher;
    entryAssets: IEntryAssets;
    entryAssetsList: IEntryAssetsList;
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
    private readonly entryAssets: IEntryAssets;
    private readonly entryAssetsList: IEntryAssetsList;

    public constructor(params: ICmsEntryZipperConfig) {
        this.zipper = params.zipper;
        this.signUrl = params.signUrl;
        this.fetcher = params.fetcher;
        this.entryAssets = params.entryAssets;
        this.entryAssetsList = params.entryAssetsList;
    }

    public async execute(
        params: ICmsEntryZipperExecuteParams
    ): Promise<ICmsEntryZipperExecuteResult> {
        const { shouldAbort, model } = params;

        const files: IFileMeta[] = [];
        let after: string | undefined = undefined;

        let hasMoreItems = true;
        let storedFiles = false;

        let id = 1;

        const addItems = async () => {
            if (storedFiles) {
                await this.zipper.finalize();
                return;
            } else if (hasMoreItems === false) {
                console.log("No more items to fetch, finalizing the zip.");

                const assets = await this.entryAssetsList.resolve(this.entryAssets.assets);

                await this.zipper.add(
                    Buffer.from(
                        JSON.stringify({
                            files,
                            assets,
                            modelId: model.modelId
                        })
                    ),
                    {
                        name: "files.json"
                    }
                );
                storedFiles = true;
                return;
            }

            const { items, meta } = await this.fetcher(after);
            if (meta.totalCount === 0) {
                console.log("No items found, aborting...");
                await this.zipper.abort();
                return;
            }

            this.entryAssets.assignAssets(items);

            const name = `entries-${id}.json`;

            files.push({
                id,
                name,
                after
            });

            await this.zipper.add(createBufferData({ items, meta, after }), {
                name
            });

            after = meta.cursor || undefined;
            hasMoreItems = meta.hasMoreItems;
            id++;
        };

        this.zipper.on("error", error => {
            console.error(error);
        });

        this.zipper.on("entry", () => {
            if (shouldAbort()) {
                this.zipper.abort();
                return;
            }
            addItems();
        });

        addItems();

        const result = await this.zipper.done();

        if (!result.Key) {
            throw new Error("Failed to upload the zip file.");
        }

        const { url, bucket, key, expiresOn } = await this.signUrl.fetch({
            key: result.Key
        });

        return {
            url,
            bucket,
            key,
            expiresOn
        };
    }
}
