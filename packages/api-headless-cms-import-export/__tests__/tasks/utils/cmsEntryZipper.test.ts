import { Archiver, CmsEntryZipper, Upload, Zipper } from "~/tasks/utils";
import { mockClient } from "aws-sdk-client-mock";
import { createS3Client, S3Client } from "@webiny/aws-sdk/client-s3";
import { createPassThrough } from "~tests/mocks/createPassThrough";

describe("cms entry zipper", () => {
    it("should properly create an instance of CMS Entry Zipper", async () => {
        expect.assertions(1);

        mockClient(S3Client);

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream: createPassThrough(),
            filename: "test.zip"
        });

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        const cmsEntryZipper = new CmsEntryZipper({
            zipper,
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
            archiver
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
});
