import { IZipper, IZipperDoneResult } from "~/tasks/utils/zipper";
import { IUrlSigner } from "~/tasks/utils/urlSigner";
import { IEntryAssets, IEntryAssetsList, IResolvedAsset } from "~/tasks/utils/entryAssets";
import { ICmsEntryFetcher } from "../cmsEntryFetcher";
import {
    ICmsAssetsZipper,
    ICmsAssetsZipperExecuteParams,
    ICmsAssetsZipperExecuteResult
} from "./abstractions/CmsAssetsZipper";
import { CmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import { CmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";
import { IFileFetcher } from "../fileFetcher";
import { CmsAssetsZipperExecuteContinueWithoutResult } from "./CmsAssetsZipperExecuteContinueWithoutResult";
import { CmsAssetsZipperExecuteDoneWithoutResult } from "./CmsAssetsZipperExecuteDoneWithoutResult";
import { PointerStore } from "~/tasks/utils/cmsAssetsZipper/PointerStore";

const manifestFileName = "manifest.json";

export interface ICmsAssetsZipperConfig {
    zipper: IZipper;
    urlSigner: IUrlSigner;
    entryFetcher: ICmsEntryFetcher;
    createEntryAssets: () => IEntryAssets;
    createEntryAssetsList: () => IEntryAssetsList;
    fileFetcher: IFileFetcher;
}

export class CmsAssetsZipper implements ICmsAssetsZipper {
    private readonly zipper: IZipper;
    private readonly urlSigner: IUrlSigner;
    private readonly entryFetcher: ICmsEntryFetcher;
    private readonly createEntryAssets: () => IEntryAssets;
    private readonly createEntryAssetsList: () => IEntryAssetsList;
    private readonly fileFetcher: IFileFetcher;

    public constructor(params: ICmsAssetsZipperConfig) {
        this.zipper = params.zipper;
        this.urlSigner = params.urlSigner;
        this.entryFetcher = params.entryFetcher;
        this.createEntryAssets = params.createEntryAssets;
        this.createEntryAssetsList = params.createEntryAssetsList;
        this.fileFetcher = params.fileFetcher;
    }

    public async execute(
        params: ICmsAssetsZipperExecuteParams
    ): Promise<ICmsAssetsZipperExecuteResult> {
        const {
            isCloseToTimeout,
            isAborted,
            entryAfter: inputEntryAfter,
            fileAfter: inputFileAfter
        } = params;

        const pointerStore = new PointerStore({
            entryMeta: {
                cursor: inputEntryAfter || null
            },
            fileCursor: inputFileAfter
        });

        const entryAssets = this.createEntryAssets();
        const entryAssetsList = this.createEntryAssetsList();

        const loadedAssets: IResolvedAsset[] = [];

        const assets: IResolvedAsset[] = [];

        /**
         * Note that this method should NEVER be awaited as it will be called recursively.
         * It handles if the upload will be finalized or aborted.
         */
        const fetchItems = async (): Promise<void> => {
            if (isAborted()) {
                pointerStore.setTaskIsAborted();
                this.zipper.abort();
                return;
            }
            const closeToTimeout = isCloseToTimeout();
            if (pointerStore.getIsStoredFiles()) {
                await this.zipper.finalize();
                return;
            } else if (!pointerStore.getEntryHasMoreItems() || closeToTimeout) {
                if (loadedAssets.length === 0) {
                    this.zipper.abort();
                    return;
                }
                await this.zipper.add(
                    Buffer.from(
                        JSON.stringify({
                            assets: loadedAssets
                        })
                    ),
                    {
                        name: manifestFileName
                    }
                );
                pointerStore.setIsStoredFiles();
                return;
            }
            const { items, meta } = await this.entryFetcher(pointerStore.getEntryCursor());
            /**
             * If no items were found, we will throw an error via abort() call.
             * This is internal from the lib we use.
             */
            if (meta.totalCount === 0) {
                console.log("No items found, aborting...");
                this.zipper.abort();
                return;
            }
            pointerStore.setEntryMeta(meta);

            /**
             * Next we want to find all the assets, which were not already assigned.
             * the assignAssets() method returns all newly found assets.
             *
             * Possibly no new assets found? Then just continue with the next batch of entries.
             */
            const assigned = entryAssets.assignAssets(items);
            if (assigned.length === 0) {
                fetchItems();
                return;
            }
            /**
             * Then we want to load all the assets from the database.
             * The matching will be done by alias or key of the file.
             *
             * Possibly no assets found? Then just continue with the next batch of entries.
             */
            let loadedAssetList = await entryAssetsList.resolve(assigned);
            const fileCursor = pointerStore.getFileCursor();
            pointerStore.resetFileCursor();
            if (loadedAssetList.length === 0) {
                fetchItems();
                return;
            } else if (fileCursor) {
                const index = loadedAssetList.findIndex(asset => asset.key === fileCursor);
                if (index > -1) {
                    loadedAssetList = loadedAssetList.slice(index + 1);
                }
            }
            /**
             * If we have some new assets, we will push them into the assets array, which will be used in addAsset() function.
             *
             */
            assets.push(...loadedAssetList);
            loadedAssets.push(...loadedAssetList);
            addAsset();
        };
        /**
         * The addAsset() function will load a single asset from the storage and add it to the zipper.
         * It calls itself while there are assets in the assets array.
         * If there are no more assets, it will call fetchItems() to fetch more items and extract assets - and circle continues.
         */
        const addAsset = async (): Promise<void> => {
            pointerStore.resetFileCursor();
            /**
             * If there are no more assets, fetch more items and extract assets.
             * fetchItems() method will check if there are more items to fetch or assets to add and
             * will finish the zip if necessary.
             */
            const asset = assets.shift();

            if (!asset || isCloseToTimeout() || isAborted()) {
                pointerStore.setFileCursor(asset?.key);
                fetchItems();
                return;
            }

            /**
             * If there is an asset, load it from the storage and add it to the zipper.
             */
            const file = await this.fileFetcher.fetch(asset.key);
            /**
             * Possibly asset was not found on the storage?
             * Then just continue with the next one.
             */
            if (!file) {
                addAsset();
                return;
            }
            this.zipper.add(file, {
                name: asset.key
            });
        };

        this.zipper.on("error", error => {
            console.error(error);
        });
        /**
         * Every time a file is added, add another one.
         * Or if the file added was a manifest file, go back to the fetch function.
         */
        this.zipper.on("entry", data => {
            if (data.name === manifestFileName) {
                fetchItems();
                return;
            }
            addAsset();
        });

        /**
         * Missing await on the fetchItems() is not an error. We do not want to await the function to be done.
         *
         * The zipper.done() is the method which we await because it will resolve when zipper.finalize() is called.
         */
        setTimeout(() => {
            fetchItems();
        }, 100);

        let result: IZipperDoneResult;

        try {
            result = await this.zipper.done();
        } catch (ex) {
            /**
             * Possibly an error which is not an abort error?
             * Abort error is thrown on .abort() method call.
             */
            if (ex.message !== "Upload aborted." || pointerStore.getTaskIsAborted()) {
                throw ex;
            }
            /**
             * There was a possibility that no assets were found, but we need to continue through the next batch of entries.
             * This happens on close to timeout.
             */
            if (loadedAssets.length === 0 && pointerStore.getEntryCursor()) {
                return new CmsAssetsZipperExecuteContinueWithoutResult({
                    entryCursor: pointerStore.getEntryCursor(),
                    fileCursor: pointerStore.getFileCursor()
                });
            }
            /**
             * An empty result set means that no assets were found and no more entries to fetch.
             */
            return new CmsAssetsZipperExecuteDoneWithoutResult();
        }

        if (!result?.Key) {
            throw new Error("Failed to upload the file.");
        }

        const signed = await this.urlSigner.sign({
            key: result.Key
        });

        if (pointerStore.getEntryCursor()) {
            return new CmsAssetsZipperExecuteContinueResult({
                ...signed,
                entryCursor: pointerStore.getEntryCursor(),
                fileCursor: pointerStore.getFileCursor()
            });
        }

        return new CmsAssetsZipperExecuteDoneResult(signed);
    }
}
