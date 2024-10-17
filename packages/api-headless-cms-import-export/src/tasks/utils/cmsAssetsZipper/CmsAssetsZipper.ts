import type { IZipper, IZipperDoneResult } from "~/tasks/utils/zipper";
import type { IEntryAssets, IEntryAssetsResolver, IResolvedAsset } from "~/tasks/utils/entryAssets";
import type { ICmsEntryFetcher } from "../cmsEntryFetcher";
import type {
    ICmsAssetsZipper,
    ICmsAssetsZipperExecuteParams,
    ICmsAssetsZipperExecuteResult
} from "./abstractions/CmsAssetsZipper";
import { CmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import { CmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";
import type { IFileFetcher } from "../fileFetcher";
import { CmsAssetsZipperExecuteContinueWithoutResult } from "./CmsAssetsZipperExecuteContinueWithoutResult";
import { CmsAssetsZipperExecuteDoneWithoutResult } from "./CmsAssetsZipperExecuteDoneWithoutResult";
import { PointerStore } from "~/tasks/utils/cmsAssetsZipper/PointerStore";
import { UniqueResolver } from "../uniqueResolver/UniqueResolver";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { stripExportPath } from "~/tasks/utils/helpers/exportPath";
import { MANIFEST_JSON } from "~/tasks/constants";

export interface ICmsAssetsZipperConfig {
    zipper: IZipper;
    entryFetcher: ICmsEntryFetcher;
    createEntryAssets: () => IEntryAssets;
    createEntryAssetsResolver: () => IEntryAssetsResolver;
    fileFetcher: IFileFetcher;
}

export class CmsAssetsZipper implements ICmsAssetsZipper {
    private readonly zipper: IZipper;
    private readonly entryFetcher: ICmsEntryFetcher;
    private readonly createEntryAssets: () => IEntryAssets;
    private readonly createEntryAssetsResolver: () => IEntryAssetsResolver;
    private readonly fileFetcher: IFileFetcher;

    public constructor(params: ICmsAssetsZipperConfig) {
        this.zipper = params.zipper;
        this.entryFetcher = params.entryFetcher;
        this.createEntryAssets = params.createEntryAssets;
        this.createEntryAssetsResolver = params.createEntryAssetsResolver;
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
        const entryAssetsResolver = this.createEntryAssetsResolver();
        const uniqueLoadedAssetsResolver = new UniqueResolver<IResolvedAsset>();
        const allLoadedAssets: IResolvedAsset[] = [];
        const assets: IResolvedAsset[] = [];
        let nextMeta: CmsEntryMeta | undefined;
        /**
         * Note that this method should NEVER be awaited as it will be called recursively.
         * It handles if the upload will be finalized or aborted.
         */
        const fetchItems = async (): Promise<void> => {
            const hasMoreItems = pointerStore.getEntryHasMoreItems();
            const isStoredFiles = pointerStore.getIsStoredFiles();
            const currentCursor = pointerStore.getEntryCursor();
            pointerStore.setEntryMeta(nextMeta);
            if (isAborted()) {
                pointerStore.setTaskIsAborted();
                this.zipper.abort();
                return;
            }
            const closeToTimeout = isCloseToTimeout();
            if (isStoredFiles) {
                await this.zipper.finalize();
                return;
            } else if (!hasMoreItems || closeToTimeout) {
                if (allLoadedAssets.length === 0) {
                    this.zipper.abort();
                    return;
                }
                await this.zipper.add(
                    Buffer.from(
                        JSON.stringify({
                            assets: allLoadedAssets,
                            size: allLoadedAssets.reduce((total, file) => {
                                const size = parseInt(file.size);
                                return total + size;
                            }, 0)
                        })
                    ),
                    {
                        name: MANIFEST_JSON
                    }
                );

                pointerStore.setIsStoredFiles();
                return;
            }
            const { items, meta } = await this.entryFetcher(currentCursor);
            /**
             * If no items were found, we will throw an error via abort() call.
             * This is internal from the lib we use.
             */
            if (meta.totalCount === 0) {
                console.log("No items found, aborting...");
                this.zipper.abort();
                return;
            }
            nextMeta = meta;

            /**
             * Next we want to find all the assets, which were not already assigned.
             * the assignAssets() method returns all newly found assets.
             *
             * Possibly no new assets found? Then just continue with the next batch of entries.
             */
            const assigned = await entryAssets.assignAssets(items);
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
            let loadedAssetList = await entryAssetsResolver.resolve(assigned);
            const currentFileCursor = pointerStore.getFileCursor();
            pointerStore.resetFileCursor();
            if (loadedAssetList.length === 0) {
                fetchItems();
                return;
            } else if (currentFileCursor) {
                const index = loadedAssetList.findIndex(asset => asset.id === currentFileCursor);
                if (index === -1) {
                    fetchItems();
                    return;
                }
                loadedAssetList = loadedAssetList.slice(index);
            }

            const uniqueAssetsList = uniqueLoadedAssetsResolver.resolve(loadedAssetList, "id");
            if (uniqueAssetsList.length === 0) {
                fetchItems();
                return;
            }
            /**
             * If we have some new assets, we will push them into the assets array, which will be used in addAsset() function.
             *
             */
            assets.push(...uniqueAssetsList);
            allLoadedAssets.push(...uniqueAssetsList);

            /**
             * We proceed with adding the assets into the zip file.
             */
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
                pointerStore.setFileCursor(asset?.id);
                fetchItems();
                return;
            }

            /**
             * If there is an asset, load it from the storage and add it to the zipper.
             */
            const file = await this.fileFetcher.stream(asset.key);
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
         * If the getIsStoredFiles() flag is true, we will go through fetchItems() method for the last time,
         * as will handle the upload finalization.
         */
        this.zipper.on("entry", () => {
            if (pointerStore.getIsStoredFiles()) {
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
            console.error(ex);
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
            if (allLoadedAssets.length === 0 && pointerStore.getEntryCursor()) {
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

        if (!result?.Key || !result.ETag) {
            throw new Error("Failed to upload the file.");
        }

        if (pointerStore.getEntryCursor() || pointerStore.getFileCursor()) {
            return new CmsAssetsZipperExecuteContinueResult({
                key: stripExportPath(result.Key),
                checksum: result.ETag.replaceAll('"', ""),
                entryCursor: pointerStore.getEntryCursor(),
                fileCursor: pointerStore.getFileCursor()
            });
        }

        return new CmsAssetsZipperExecuteDoneResult({
            key: stripExportPath(result.Key),
            checksum: result.ETag.replaceAll('"', "")
        });
    }
}
