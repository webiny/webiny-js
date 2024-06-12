import AdmZip from "adm-zip";
import { createCmsEntryZipper } from "~tests/mocks/createCmsEntryZipper";
import { fetchItems } from "./mocks/cmsEntryZipperItems";

describe("cms entry zipper", () => {
    it("should properly create an instance of CMS Entry Zipper", async () => {
        expect.assertions(1);

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
            }
        });

        expect(cmsEntryZipper.execute).toBeFunction();

        try {
            await cmsEntryZipper.execute({
                shouldAbort: () => {
                    return false;
                },
                model: {
                    modelId: "aTestModelId"
                }
            });
        } catch (ex) {
            expect(ex).toEqual("Must not happen!");
        }
    });

    it("should zip entries into a file", async () => {
        const { cmsEntryZipper, getBuffer } = createCmsEntryZipper({
            fetcher: async after => {
                return fetchItems(after);
            }
        });

        await cmsEntryZipper.execute({
            shouldAbort: () => {
                return false;
            },
            model: {
                modelId: "aTestModelId"
            }
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
                        id: "1"
                    },
                    {
                        id: "2"
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
                        id: "3"
                    },
                    {
                        id: "4"
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
                        id: "5"
                    },
                    {
                        id: "6"
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
                        id: "7"
                    },
                    {
                        id: "8"
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
            modelId: "aTestModelId"
        });
    });
});
