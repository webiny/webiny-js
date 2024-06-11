import { CmsEntry, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { IZipper } from "./abstractions/Zipper";
import { IArchiver } from "./abstractions/Archiver";
import {
    ICmsEntryZipper,
    ICmsEntryZipperExecuteParams
} from "~/tasks/utils/abstractions/CmsEntryZipper";
import { IFileMeta } from "./types";

export interface ICmsEntryZipperConfig {
    zipper: IZipper;
    archiver: IArchiver;
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
            items: items.map(item => {
                return {
                    ...item,
                    ...item.values
                };
            }),
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
    private readonly archiver: IArchiver;
    private readonly fetcher: ICmsEntryFetcher;

    public constructor(params: ICmsEntryZipperConfig) {
        this.zipper = params.zipper;
        this.archiver = params.archiver;
        this.fetcher = params.fetcher;
    }

    public async execute(params: ICmsEntryZipperExecuteParams): Promise<void> {
        const { shouldAbort } = params;

        const files: IFileMeta[] = [];
        let after: string | undefined = undefined;
        let storedFiles = false;

        let id = 1;

        const addItems = async () => {
            if (storedFiles) {
                await this.zipper.finalize();
                return;
            }

            const { items, meta } = await this.fetcher(after);
            if (meta.totalCount === 0) {
                await this.zipper.finalize();
                return;
            } else if (items.length === 0 && meta.hasMoreItems === false) {
                await this.zipper.add(Buffer.from(JSON.stringify({ files })), {
                    name: "files.json"
                });
                storedFiles = true;
                return;
            }

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
            id++;
        };

        this.archiver.archiver.on("entry", () => {
            if (shouldAbort()) {
                this.archiver.archiver.abort();
                return;
            }
            addItems();
        });

        addItems();

        await this.zipper.done();
    }
}
