import { EntryAssetsList } from "~/tasks/utils/EntryAssetsList";
import { useHandler } from "~tests/helpers/useHandler";
import { IEntryAssetsList } from "~/tasks/utils/abstractions/EntryAssetsList";
import { Context } from "~/types";
import { createImages } from "~tests/mocks/images";
import { IAssets } from "~/tasks/utils/abstractions/EntryAssets";

describe("entry assets list", () => {
    let context: Context;
    let entryAssetsList: IEntryAssetsList;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();

        entryAssetsList = new EntryAssetsList({
            listFiles: async opts => {
                return context.fileManager.listFiles(opts);
            }
        });
    });

    it("should fetch assets - empty list", async () => {
        const result = await entryAssetsList.fetch({});

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

        const results = await entryAssetsList.fetch(assets);

        expect(results.length).toEqual(images.length);

        for (const image of images) {
            const result = results.find(
                r => r.key === image.key || r.aliases.some(a => image.aliases.includes(a))
            );
            expect(result).not.toBeUndefined();
        }
    });
});
