import { createCmsEntryZipper } from "~tests/mocks/createCmsEntryZipper";
import { ICmsEntryFetcherResult } from "~/tasks/utils";
import AdmZip from "adm-zip";

describe("cms entry zipper", () => {
    it.skip("should properly create an instance of CMS Entry Zipper", async () => {
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
                }
            });
        } catch (ex) {
            expect(ex).toEqual("Must not happen!");
        }
    });

    it("should zip entries into a file", async () => {
        const { cmsEntryZipper, getBuffer } = createCmsEntryZipper({
            fetcher: async after => {
                if (after === "2") {
                    return {
                        items: [
                            {
                                id: "3"
                            },
                            {
                                id: "4"
                            }
                        ],
                        meta: {
                            totalCount: 4,
                            cursor: "4",
                            hasMoreItems: false
                        }
                    } as ICmsEntryFetcherResult;
                } else if (after) {
                    return {
                        items: [],
                        meta: {
                            totalCount: 4,
                            cursor: null,
                            hasMoreItems: false
                        }
                    } as ICmsEntryFetcherResult;
                }

                return {
                    items: [
                        {
                            id: "1"
                        },
                        {
                            id: "2"
                        }
                    ],
                    meta: {
                        totalCount: 4,
                        cursor: "2",
                        hasMoreItems: false
                    }
                } as ICmsEntryFetcherResult;
            }
        });

        await cmsEntryZipper.execute({
            shouldAbort: () => {
                return false;
            }
        });

        const buffer = getBuffer();

        expect(buffer).toBeInstanceOf(Buffer);

        const zipped = buffer!.toString("utf-8");

        expect(zipped).toMatch("entries-1.json");
        expect(zipped).toMatch("entries-2.json");

        const zip = new AdmZip(buffer);

        const zipEntries = zip.getEntries();
        expect(zipEntries).toHaveLength(3);

        expect(zipEntries[0].entryName).toEqual("entries-1.json");
        expect(zipEntries[1].entryName).toEqual("entries-2.json");
        expect(zipEntries[2].entryName).toEqual("files.json");

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
                    totalCount: 4,
                    cursor: "2",
                    hasMoreItems: false
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
                    totalCount: 4,
                    cursor: "4",
                    hasMoreItems: false
                },
                after: "2"
            })
        );

        const filesJson = JSON.parse(zip.readAsText(zipEntries[2]));
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
                }
            ]
        });
    });
});
