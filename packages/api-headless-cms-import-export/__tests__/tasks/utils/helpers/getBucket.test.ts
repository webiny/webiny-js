import { getBucket } from "~/tasks/utils/helpers/getBucket";

describe("get bucket", () => {
    it("should get the bucket", async () => {
        process.env.S3_BUCKET = "a-test-bucket";
        const bucket = getBucket();

        expect(bucket).toEqual("a-test-bucket");
    });

    it("should throw an error because the bucket is not set", async () => {
        delete process.env.S3_BUCKET;
        expect.assertions(2);

        try {
            getBucket();
        } catch (ex) {
            expect(ex.message).toEqual("Missing S3_BUCKET environment variable.");
        }
        process.env.S3_BUCKET = "";
        try {
            getBucket();
        } catch (ex) {
            expect(ex.message).toEqual("Missing S3_BUCKET environment variable.");
        }
    });
});
