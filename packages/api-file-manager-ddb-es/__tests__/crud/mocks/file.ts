import { File } from "@webiny/api-file-manager/types/file";
import { ListTagsResponse } from "@webiny/api-file-manager/types";

interface Params {
    index: number;
    tenant: string;
    locale: string;
}

const createTags = (params: Params): string[] => {
    const { index, tenant, locale } = params;
    const tags = [`tag-${index}`, `tag-${tenant}`, `tag-${locale}`];
    if (index % 2 === 0) {
        tags.push(`tag-${index + 1}`);
    }
    return Array.from(new Set<string>(tags));
};

export const createExpectedTags = (
    params: Omit<Params, "index"> & { amount: number }
): ListTagsResponse[] => {
    const { amount } = params;
    const result: Record<string, ListTagsResponse> = {};

    for (let index = 0; index < amount; index++) {
        const tags = createTags({
            ...params,
            index
        });
        for (const tag of tags) {
            result[tag] = {
                tag,
                count: (result[tag]?.count || 0) + 1
            };
        }
    }

    return Object.values(result)
        .sort((a, b) => {
            return a.tag < b.tag ? -1 : 1;
        })
        .sort((a, b) => {
            return a.count > b.count ? -1 : 1;
        });
};

export const createMockFileData = (params: Params): File => {
    const { index, tenant, locale } = params;
    return {
        id: `file-${index}`,
        key: `file-${index}.png`,
        name: `file-${index}.png`,
        size: 100,
        type: "image/png",
        tags: createTags(params),
        createdOn: new Date().toISOString(),
        createdBy: {
            id: "a",
            displayName: "a",
            type: "admin"
        },
        meta: {
            private: true,
            public: false
        },
        aliases: [],
        locale,
        tenant,
        webinyVersion: "0.0.0"
    };
};
