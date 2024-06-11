// @ts-expect-error
import BaseArchiver from "archiver/lib/core";
import { Archiver } from "~/tasks/utils/Archiver";

describe("archiver", () => {
    it("should properly create an instance of Archiver", async () => {
        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        expect(archiver.archiver).not.toBeNull();
        expect(archiver.archiver).toBeInstanceOf(BaseArchiver);
    });
});
