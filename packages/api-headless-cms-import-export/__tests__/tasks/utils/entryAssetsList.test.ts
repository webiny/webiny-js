import { useHandler } from "~tests/helpers/useHandler";
import { Context } from "~/types";
import { createImages } from "~tests/mocks/images";
import { EntryAssetsList, IAssets, IEntryAssetsList } from "~/tasks/utils/entryAssets";

describe("entry assets list", () => {
    let context: Context;
    let entryAssetsList: IEntryAssetsList;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();

        entryAssetsList = new EntryAssetsList({
            listFiles: async opts => {
                const [items, meta] = await context.fileManager.listFiles(opts);
                return {
                    items,
                    meta
                };
            }
        });
    });

    it("should fetch assets - empty list", async () => {
        const result = await entryAssetsList.resolve([]);

        expect(result).toEqual([]);
    });

    it("should fetch assets", async () => {
        const images = createImages();

        expect.assertions(images.length + 1);

        for (const image of images) {
            try {
                await context.fileManager.createFile(image.data);
            } catch (ex) {
                console.log(ex);
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

        const results = await entryAssetsList.resolve(Object.values(assets));

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
