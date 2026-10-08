import crypto from "crypto";
import fs from "fs";
import path from "path";

/*
 * Records the lockfile hash that the version check just passed on.
 *
 * Written to a temporary file and renamed into place, because `webiny watch` can be running while
 * another command starts. A plain write truncates first, so a reader arriving in that window would
 * parse a half-written file, treat it as a miss and pay for `yarn info` again. The rename is atomic,
 * and the temporary file sits in the same directory so it never crosses a filesystem boundary.
 */
export const writeClearedYarnLockHash = (cacheFilePath: string, yarnLockHash: string): void => {
    const temporaryFilePath = `${cacheFilePath}.${process.pid}.${crypto.randomUUID()}.tmp`;

    try {
        fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
        fs.writeFileSync(temporaryFilePath, JSON.stringify({ yarnLockHash }));
        fs.renameSync(temporaryFilePath, cacheFilePath);
    } catch {
        // A read-only or otherwise unwritable project just pays for the check every time. Clear the
        // temporary file if we got as far as creating one, so failures don't pile up in `.webiny/`.
        try {
            fs.rmSync(temporaryFilePath, { force: true });
        } catch {
            // Nothing further to try.
        }
    }
};
