import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/helpers/useHandler";
import type { Context } from "~/types";
import { createImages } from "~tests/mocks/images";
import type { IAssets, IEntryAssetsResolver } from "~/tasks/utils/entryAssets";
import { EntryAssetsResolver } from "~/tasks/utils/entryAssets";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";

describe("entry assets resolver", () => {
    let context: Context;
    let entryAssetsResolver: IEntryAssetsResolver;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();
        const listFiles = context.container.resolve(ListFilesUseCase);

        entryAssetsResolver = new EntryAssetsResolver({
            fetchFiles: async opts => {
                const result = await listFiles.execute(opts ?? {});

                return result.value;
            }
        });
    });

    it("should fetch assets - empty list", async () => {
        const result = await entryAssetsResolver.resolve([]);

        expect(result).toEqual([]);
    });

    it("should fetch assets", async () => {
        const images = createImages();
        const createFile = context.container.resolve(CreateFileUseCase);

        expect.assertions(13);

        for (const image of images) {
            const result = await createFile.execute(image.data);
            expect(result.isOk()).toBe(true);
        }

        const assets = images.reduce<IAssets>((items, item) => {
            items[item.url] = {
                url: item.url,
                key: item.key
            };
            return items;
        }, {});

        const results = await entryAssetsResolver.resolve(Object.values(assets));

        expect(results.length).toEqual(images.length);

        for (const image of images) {
            const result = results.find(asset => {
                return asset.key === image.key;
            });
            expect(result).not.toBeUndefined();
        }
    });
});
