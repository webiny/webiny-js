import AdmZip from "adm-zip";
import { createCmsEntryZipper } from "~tests/mocks/createCmsEntryZipper";
import { fetchItems, findImage, images } from "./mocks/cmsEntryZipperItems";
import { IAssets, IEntryAssets } from "~/tasks/utils/abstractions/EntryAssets";
import { IAssetItem, IEntryAssetsList } from "~/tasks/utils/abstractions/EntryAssetsList";
import { createModelPlugin } from "~tests/mocks/model";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { matchKeyOrAlias } from "~/tasks/utils/helpers/matchKeyOrAlias";

describe("cms entry zipper", () => {
    const model = createModelPlugin().contentModel as CmsModel;

    it("should abort upload because of no items", async () => {
        expect.assertions(2);

        const { cmsEntryZipper } = createCmsEntryZipper({
            fetcher: async () => {
                return {
                    items: [],
                    meta: {
                        totalCount: 0,
                        cursor: null,
                        hasMoreItems: false
                    }
                };
            },
            entryAssets: {} as IEntryAssets,
            entryAssetsList: {} as IEntryAssetsList
        });

        expect(cmsEntryZipper.execute).toBeFunction();

        try {
            const result = await cmsEntryZipper.execute({
                shouldAbort: () => {
                    return false;
                },
                model
            });

            expect(result).toEqual("should not happen");
        } catch (ex) {
            expect(ex.message).toEqual("Upload aborted.");
        }
    });

    it("should zip entries into a file - no assets", async () => {
        const assets: IAssets = {};
        const { cmsEntryZipper, getBuffer } = createCmsEntryZipper({
            fetcher: async after => {
                return fetchItems(after);
            },
            entryAssets: {
                assets,
                assignAssets(input) {
                    if (Array.isArray(input)) {
                        for (const item of input) {
                            const url = item.values.image;
                            if (!url) {
                                return;
                            }
                            const result = matchKeyOrAlias(url);
                            if (!result) {
                                return;
                            }
                            assets[url] = {
                                ...result,
                                url
                            };
                        }
                        return;
                    }
                    const url = input.values.image;
                    if (!url) {
                        return;
                    }
                    const result = matchKeyOrAlias(url);
                    if (!result) {
                        return;
                    }
                    assets[url] = {
                        ...result,
                        url
                    };
                }
            },
            entryAssetsList: {
                async resolve(input) {
                    return Object.values(input)
                        .map(item => {
                            const image = findImage(item);
                            if (!image) {
                                return null;
                            }

                            return {
                                id: image.id,
                                key: image.key,
                                aliases: image.alias ? [image.alias] : []
                            };
                        })
                        .filter((item): item is IAssetItem => !!item);
                }
            }
        });

        await cmsEntryZipper.execute({
            shouldAbort: () => {
                return false;
            },
            model
        });

        const buffer = getBuffer();

        expect(buffer).toBeInstanceOf(Buffer);

        const zipped = buffer!.toString("utf-8");

        expect(zipped).toMatch("entries-1.json");
        expect(zipped).toMatch("entries-2.json");

        const zip = new AdmZip(buffer);

        const zipEntries = zip.getEntries();
        expect(zipEntries).toHaveLength(5);

        expect(zipEntries[0].entryName).toEqual("entries-1.json");
        expect(zipEntries[1].entryName).toEqual("entries-2.json");
        expect(zipEntries[2].entryName).toEqual("entries-3.json");
        expect(zipEntries[3].entryName).toEqual("entries-4.json");
        expect(zipEntries[4].entryName).toEqual("files.json");

        const entries1Json = zip.readAsText(zipEntries[0]);

        expect(entries1Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "1",
                        values: {
                            image: images[1].url
                        }
                    },
                    {
                        id: "2",
                        values: {
                            image: images[2].url
                        }
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "2",
                    hasMoreItems: true
                }
            })
        );

        const entries2Json = zip.readAsText(zipEntries[1]);

        expect(entries2Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "3",
                        values: {
                            image: images[3].url
                        }
                    },
                    {
                        id: "4",
                        values: {
                            image: images[4].url
                        }
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "4",
                    hasMoreItems: true
                },
                after: "2"
            })
        );

        const entries3Json = zip.readAsText(zipEntries[2]);

        expect(entries3Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "5",
                        values: {
                            image: images[5].url
                        }
                    },
                    {
                        id: "6",
                        values: {
                            image: images[6].url
                        }
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "6",
                    hasMoreItems: true
                },
                after: "4"
            })
        );

        const entries4Json = zip.readAsText(zipEntries[3]);

        expect(entries4Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "7",
                        values: {
                            image: images[7].url
                        }
                    },
                    {
                        id: "8",
                        values: {
                            image: images[8].url
                        }
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "8",
                    hasMoreItems: false
                },
                after: "6"
            })
        );

        const filesJson = JSON.parse(zip.readAsText(zipEntries[4]));
        expect(filesJson).toEqual({
            files: [
                {
                    id: 1,
                    name: "entries-1.json"
                },
                {
                    id: 2,
                    name: "entries-2.json",
                    after: "2"
                },
                {
                    id: 3,
                    name: "entries-3.json",
                    after: "4"
                },
                {
                    id: 4,
                    name: "entries-4.json",
                    after: "6"
                }
            ],
            assets: [
                {
                    aliases: [],
                    id: "1",
                    key: "files/1.jpg"
                },
                {
                    aliases: ["possibly-an-alias/2.jpg"],
                    id: "2",
                    key: "files/2.jpg"
                },
                {
                    aliases: [],
                    id: "3",
                    key: "files/3.jpg"
                },
                {
                    aliases: [],
                    id: "4",
                    key: "files/4.jpg"
                },
                {
                    aliases: [],
                    id: "5",
                    key: "files/5.jpg"
                },
                {
                    aliases: ["is-alias/6.jpg"],
                    id: "6",
                    key: "files/6.jpg"
                },
                {
                    aliases: [],
                    id: "7",
                    key: "files/7.jpg"
                },
                {
                    aliases: [],
                    id: "8",
                    key: "files/8.jpg"
                }
            ],
            modelId: model.modelId
        });
    });
});
