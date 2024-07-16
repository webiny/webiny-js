import { ZipCombiner } from "~/tasks/utils/zipCombiner";
import { createUrlSigner } from "~tests/mocks/createUrlSigner";
import { createZipper } from "~tests/mocks/createZipper";
import { createFileFetcher } from "~tests/mocks/createFileFetcher";
import { CmsModel } from "@webiny/api-headless-cms/types";

describe("zip combiner", () => {
    it("should fail because no files to combine", async () => {
        expect.assertions(1);
        const combiner = new ZipCombiner({
            urlSigner: createUrlSigner(),
            zipper: createZipper(),
            fileFetcher: createFileFetcher()
        });

        try {
            await combiner.resolve({
                source: "test/source-",
                isCloseToTimeout: () => false,
                isAborted: () => false,
                lastFileProcessed: undefined,
                model: {
                    modelId: "aModel"
                } as CmsModel
            });
        } catch (ex) {
            expect(ex.message).toBe(`No files found in with prefix "test/source-".`);
        }
    });

    it("should fail because no files were added to the zip", async () => {
        expect.assertions(3);
        const combiner = new ZipCombiner({
            urlSigner: createUrlSigner(),
            zipper: createZipper(),
            fileFetcher: createFileFetcher({
                list: async () => {
                    return [
                        {
                            key: "test/source-1.zip",
                            size: 100,
                            lastModified: new Date(),
                            name: "source-1.zip"
                        }
                    ];
                }
            })
        });

        const logs: any[] = [];
        const errors: any[] = [];

        console.log = (...args: any[]) => {
            return logs.push(...args);
        };
        console.error = (...args: any[]) => {
            return errors.push(...args);
        };

        try {
            await combiner.resolve({
                source: "test/source-",
                isCloseToTimeout: () => false,
                isAborted: () => false,
                lastFileProcessed: undefined,
                model: {
                    modelId: "aModel"
                } as CmsModel
            });
        } catch (ex) {
            expect(ex.message).toBe(`Upload aborted.`);
            expect(logs).toEqual([]);
            expect(errors).toEqual([
                'Failed to fetch file "test/source-1.zip".',
                "No files were added to the zip. Cannot finalize.",
                'But there were 1 found via the fetcher target "test/source-".'
            ]);
        }
    });

    it("should abort the upload", async () => {
        expect.assertions(1);
        const combiner = new ZipCombiner({
            urlSigner: createUrlSigner(),
            zipper: createZipper(),
            fileFetcher: createFileFetcher({
                list: async () => {
                    return [
                        {
                            key: "test/source-1.zip",
                            size: 100,
                            lastModified: new Date(),
                            name: "source-1.zip"
                        }
                    ];
                }
            })
        });

        try {
            await combiner.resolve({
                source: "test/source-",
                isAborted: () => true,
                isCloseToTimeout: () => false,
                lastFileProcessed: undefined,
                model: {
                    modelId: "aModel"
                } as CmsModel
            });
        } catch (ex) {
            expect(ex.message).toBe(`Upload aborted.`);
        }
    });

    it("should fail because lastFileProcessed does not exist in the list of fetched", async () => {
        expect.assertions(1);
        const combiner = new ZipCombiner({
            urlSigner: createUrlSigner(),
            zipper: createZipper(),
            fileFetcher: createFileFetcher({
                list: async () => {
                    return [
                        {
                            key: "test/source-1.zip",
                            size: 100,
                            lastModified: new Date(),
                            name: "source-1.zip"
                        }
                    ];
                }
            })
        });

        try {
            await combiner.resolve({
                source: "test/source-",
                isAborted: () => false,
                isCloseToTimeout: () => false,
                lastFileProcessed: "some-unknown-file.zip",
                model: {
                    modelId: "aModel"
                } as CmsModel
            });
        } catch (ex) {
            expect(ex.message).toBe(
                `Failed to find file "some-unknown-file.zip" in the list of files.`
            );
        }
    });
});
