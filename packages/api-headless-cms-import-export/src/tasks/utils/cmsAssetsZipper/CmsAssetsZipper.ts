import { IZipper } from "~/tasks/utils/abstractions/Zipper";
import { ISignUrl } from "~/tasks/utils/abstractions/SignedUrl";
import { IEntryAssets } from "~/tasks/utils/entryAssets";
import { ICmsEntryFetcher } from "../cmsEntryFetcher";
import { ICmsAssetsFetcher } from "../cmsAssetsFetcher";
import {
    ICmsAssetsZipper,
    ICmsAssetsZipperExecuteParams,
    ICmsAssetsZipperExecuteResult
} from "./abstractions/CmsAssetsZipper";
import { CmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import { CmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";

export interface ICmsAssetsZipperConfig {
    zipper: IZipper;
    signUrl: ISignUrl;
    entryFetcher: ICmsEntryFetcher;
    assetFetcher: ICmsAssetsFetcher;
    createEntryAssets: () => IEntryAssets;
}

export class CmsAssetsZipper implements ICmsAssetsZipper {
    private readonly zipper: IZipper;
    private readonly signUrl: ISignUrl;
    private readonly entryFetcher: ICmsEntryFetcher;
    private readonly assetFetcher: ICmsAssetsFetcher;
    private readonly createEntryAssets: () => IEntryAssets;

    public constructor(params: ICmsAssetsZipperConfig) {
        this.zipper = params.zipper;
        this.signUrl = params.signUrl;
        this.entryFetcher = params.entryFetcher;
        this.assetFetcher = params.assetFetcher;
        this.createEntryAssets = params.createEntryAssets;
    }

    public async execute(
        params: ICmsAssetsZipperExecuteParams
    ): Promise<ICmsAssetsZipperExecuteResult> {
        const { isCloseToTimeout, isAborted, model, after: inputAfter } = params;

        const id = 1;

        const after = inputAfter;
        const continueAfter: string | undefined = undefined;

        const entryAssets = this.createEntryAssets();

        const addItems = async () => {
            if (isAborted()) {
                this.zipper.abort();
                return;
            }
            const closeToTimeout = isCloseToTimeout();

            const { items, meta } = await this.entryFetcher(after);
            if (meta.totalCount === 0) {
                console.log("No items found, aborting...");
                this.zipper.abort();
                return;
            }

            entryAssets.assignAssets(items);
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
            return new CmsAssetsZipperExecuteContinueResult({
                key: result.Key,
                cursor: continueAfter
            });
        }

        const { url, bucket, key, expiresOn } = await this.signUrl.fetch({
            key: result.Key
        });

        return new CmsAssetsZipperExecuteDoneResult({
            key,
            url,
            bucket,
            expiresOn
        });
    }
}
