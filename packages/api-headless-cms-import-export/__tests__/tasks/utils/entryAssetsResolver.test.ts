import { useHandler } from "~tests/helpers/useHandler";
import type { Context } from "~/types";
import { createImages } from "~tests/mocks/images";
import type { IAssets, IEntryAssetsResolver } from "~/tasks/utils/entryAssets";
import { EntryAssetsResolver } from "~/tasks/utils/entryAssets";

describe("entry assets resolver", () => {
    let context: Context;
    let entryAssetsResolver: IEntryAssetsResolver;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();

        entryAssetsResolver = new EntryAssetsResolver({
            fetchFiles: async opts => {
                const [items, meta] = await context.fileManager.listFiles(opts);
                return {
                    items,
                    meta
                };
            }
        });
    });

    it("should fetch assets - empty list", async () => {
        const result = await entryAssetsResolver.resolve([]);

        expect(result).toEqual([]);
    });

    it("should fetch assets", async () => {
        const images = createImages();

        expect.assertions(images.length + 1);

        for (const image of images) {
            try {
                await context.fileManager.createFile(image.data);
            } catch (ex) {
                console.error(ex);
                expect(ex.message).toEqual("Must not happen!");
            }
        }

        const assets = images.reduce<IAssets>((items, item) => {
            if (item.aliases.length > 0) {
                items[item.url] = {
                    url: item.url,
                    alias: item.aliases[0]
                };
                return items;
            }
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
                if (asset.key === image.key) {
                    return true;
                }
                const aliases = asset.aliases as string[];
                return aliases.some(a => image.aliases.includes(a));
            });
            expect(result).not.toBeUndefined();
        }
    });
});
