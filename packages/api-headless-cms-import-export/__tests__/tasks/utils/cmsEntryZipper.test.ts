import AdmZip from "adm-zip";
import { createCmsEntryZipper } from "~tests/mocks/createCmsEntryZipper";
import { fetchItems, images } from "./mocks/cmsEntryZipperItems";
import { createModelPlugin } from "~tests/mocks/model";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { createCmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher";
import { createUniqueResolver } from "~tests/mocks/createUniqueResolver";
import { createEntryAssets } from "~tests/mocks/createEntryAssets";
import { MANIFEST_JSON } from "~/tasks/constants";

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
            uniqueAssetsResolver: createUniqueResolver(),
            entryAssets: createEntryAssets()
        });

        expect(cmsEntryZipper.execute).toBeFunction();

        try {
            const result = await cmsEntryZipper.execute({
                isCloseToTimeout() {
                    return false;
                },
                isAborted() {
                    return false;
                },
                model,
                after: undefined,
                exportAssets: false
            });

            expect(result).toEqual("should not happen");
        } catch (ex) {
            expect(ex.message).toEqual("Upload aborted.");
        }
    });

    it("should zip entries into a file - no assets", async () => {
        const { cmsEntryZipper, getBuffer } = createCmsEntryZipper({
            fetcher: createCmsEntryFetcher(async after => {
                return fetchItems(after);
            }),
            uniqueAssetsResolver: createUniqueResolver(),
            entryAssets: createEntryAssets()
        });

        await cmsEntryZipper.execute({
            isCloseToTimeout() {
                return false;
            },
            isAborted() {
                return false;
            },
            model,
            after: undefined,
            exportAssets: false
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
        expect(zipEntries[4].entryName).toEqual(MANIFEST_JSON);

        const entries1Json = zip.readAsText(zipEntries[0]);

        expect(entries1Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "1",
                        image: images[1].url
                    },
                    {
                        id: "2",
                        image: images[2].url
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "2#0001",
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
                        image: images[3].url
                    },
                    {
                        id: "4",
                        image: images[4].url
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "4#0001",
                    hasMoreItems: true
                },
                after: "2#0001"
            })
        );

        const entries3Json = zip.readAsText(zipEntries[2]);

        expect(entries3Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "5",
                        image: images[5].url
                    },
                    {
                        id: "6",
                        image: images[6].url
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "6#0001",
                    hasMoreItems: true
                },
                after: "4#0001"
            })
        );

        const entries4Json = zip.readAsText(zipEntries[3]);

        expect(entries4Json).toEqual(
            JSON.stringify({
                items: [
                    {
                        id: "7",
                        image: images[7].url
                    },
                    {
                        id: "8",
                        image: images[8].url
                    }
                ],
                meta: {
                    totalCount: 8,
                    cursor: "8#0001",
                    hasMoreItems: false
                },
                after: "6#0001"
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
                    after: "2#0001"
                },
                {
                    id: 3,
                    name: "entries-3.json",
                    after: "4#0001"
                },
                {
                    id: 4,
                    name: "entries-4.json",
                    after: "6#0001"
                }
            ],
            assets: [],
            model: expect.objectContaining({
                group: model.group.id,
                fields: model.fields,
                modelId: model.modelId
            })
        });
    });
});
