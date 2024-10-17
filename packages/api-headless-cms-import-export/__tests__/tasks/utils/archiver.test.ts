// @ts-expect-error
import BaseArchiver from "archiver/lib/core";
import { createArchiver } from "~/tasks/utils/archiver";

describe("archiver", () => {
    it("should properly create an instance of Archiver", async () => {
        const archiver = createArchiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        expect(archiver.archiver).not.toBeNull();
        expect(archiver.archiver).toBeInstanceOf(BaseArchiver);
    });
});
