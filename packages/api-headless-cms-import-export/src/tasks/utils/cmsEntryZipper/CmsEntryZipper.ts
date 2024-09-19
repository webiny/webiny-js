import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { ICmsEntryEntriesJson, ICmsEntryManifestJson, IFileMeta } from "../types";
import { CmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult";
import { CmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult";
import type {
    ICmsEntryZipper,
    ICmsEntryZipperExecuteParams,
    ICmsEntryZipperExecuteResult
} from "./abstractions/CmsEntryZipper";
import type { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher/abstractions/CmsEntryFetcher";
import type { IZipper } from "~/tasks/utils/zipper";
import type { IAsset, IEntryAssets } from "~/tasks/utils/entryAssets";
import type { IUniqueResolver } from "~/tasks/utils/uniqueResolver/abstractions/UniqueResolver";
import { sanitizeModel } from "@webiny/api-headless-cms/export/crud/sanitize";
import { stripExportPath } from "~/tasks/utils/helpers/exportPath";
import { cleanChecksum } from "~/tasks/utils/helpers/cleanChecksum";
import { MANIFEST_JSON } from "~/tasks/constants";

export interface ICmsEntryZipperConfig {
    zipper: IZipper;
    fetcher: ICmsEntryFetcher;
    entryAssets: IEntryAssets;
    uniqueAssetsResolver: IUniqueResolver<IAsset>;
}

const createBufferData = (params: ICmsEntryEntriesJson) => {
    const { items, meta, after } = params;
    return Buffer.from(
        JSON.stringify({
            items: items.map((item: Partial<CmsEntry>) => {
                /**
                 * We will use the entryId as the ID of the entry.
                 */
                const id = item.entryId;
                /**
                 * We need to remove some fields that are not needed in the export.
                 */
                delete item.tenant;
                delete item.locale;
                delete item.locked;
                delete item.webinyVersion;
                delete item.version;
                delete item.entryId;
                delete item.modelId;

                const values = item.values;

                delete item.values;

                return {
                    ...item,
                    ...values,
                    id
                };
            }),
            meta,
            after
        })
    );
};

export class CmsEntryZipper implements ICmsEntryZipper {
    private readonly zipper: IZipper;
    private readonly fetcher: ICmsEntryFetcher;
    private readonly entryAssets: IEntryAssets;
    private readonly uniqueAssetsResolver: IUniqueResolver<IAsset>;

    public constructor(params: ICmsEntryZipperConfig) {
        this.zipper = params.zipper;
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
                const output: ICmsEntryManifestJson = {
                    files,
                    assets,
                    model: sanitizeModel(
                        {
                            id: model.group.id
                        },
                        model
                    )
                };
                await this.zipper.add(Buffer.from(JSON.stringify(output)), {
                    name: MANIFEST_JSON
                });
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

            const itemsAssets = await this.entryAssets.assignAssets(items);

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

        const checksum = cleanChecksum(result.ETag || "");

        const key = stripExportPath(result.Key);
        if (continueAfter) {
            return new CmsEntryZipperExecuteContinueResult({
                key,
                checksum,
                cursor: continueAfter
            });
        }

        return new CmsEntryZipperExecuteDoneResult({
            key,
            checksum
        });
    }
}
