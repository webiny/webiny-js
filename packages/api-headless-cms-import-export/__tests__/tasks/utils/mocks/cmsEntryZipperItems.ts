import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { GenericRecord } from "@webiny/api/types";
import type { ICmsEntryFetcherResult } from "~/tasks/utils/cmsEntryFetcher";

const cloudfrontUrl = "https://aCloundfrontDistributionId.cloudfront.net";

export interface IImage {
    id: string;
    url: string;
    key: string;
    alias?: string;
}

export const images: GenericRecord<number, IImage> = {
    1: {
        id: "1",
        url: `${cloudfrontUrl}/files/1.jpg`,
        key: "files/1.jpg"
    },
    2: {
        id: "2",
        url: `${cloudfrontUrl}/possibly-an-alias/2.jpg`,
        key: "files/2.jpg",
        alias: "possibly-an-alias/2.jpg"
    },
    3: {
        id: "3",
        url: `${cloudfrontUrl}/files/3.jpg`,
        key: "files/3.jpg"
    },
    4: {
        id: "4",
        url: `${cloudfrontUrl}/files/4.jpg`,
        key: "files/4.jpg"
    },
    5: {
        id: "5",
        url: `${cloudfrontUrl}/files/5.jpg`,
        key: "files/5.jpg"
    },
    6: {
        id: "6",
        url: `${cloudfrontUrl}/is-alias/6.jpg`,
        key: "files/6.jpg",
        alias: "is-alias/6.jpg"
    },
    7: {
        id: "7",
        url: `${cloudfrontUrl}/files/7.jpg`,
        key: "files/7.jpg"
    },
    8: {
        id: "8",
        url: `${cloudfrontUrl}/files/8.jpg`,
        key: "files/8.jpg"
    }
};

interface IFindImageParamsKey {
    key: string;
    alias?: never;
}

interface IFindImageParamsAlias {
    key?: never;
    alias: string;
}

type IFindImageParams = IFindImageParamsKey | IFindImageParamsAlias;

export const findImage = (params: IFindImageParams) => {
    return Object.values(images).find(image => {
        if (params.key) {
            return image.url.endsWith(params.key);
        } else if (params.alias) {
            return image.url.endsWith(params.alias);
        }
        return false;
    });
};

export const createEntries = () => {
    return Object.values(images).map<CmsEntry>(image => {
        return {
            id: `${image.id}#0001`,
            entryId: image.id,
            values: {
                image: image.url
            }
        } as unknown as CmsEntry;
    });
};

export const fetchItems = (after?: string | null): ICmsEntryFetcherResult => {
    const entries = createEntries();

    if (!after) {
        const items = entries.slice(0, 2);
        return {
            items,
            meta: {
                totalCount: createEntries().length,
                cursor: items[items.length - 1]?.id || null,
                hasMoreItems: true
            }
        } as ICmsEntryFetcherResult;
    }

    const index = entries.findIndex(item => item.id === after);
    if (index > -1) {
        const items = entries.slice(index + 1, index + 3);
        return {
            items,
            meta: {
                totalCount: createEntries().length,
                cursor: items[items.length - 1]?.id || null,
                hasMoreItems: index + 3 < entries.length
            }
        } as ICmsEntryFetcherResult;
    }
    return {
        items: [],
        meta: {
            totalCount: 0,
            cursor: null,
            hasMoreItems: false
        }
    } as ICmsEntryFetcherResult;
};
