import fs from "fs-extra";
import crypto from "crypto";
import path from "path";
import glob from "glob";
import util from "util";
import debug from "debug";

const log = debug("wcc");

const globFiles = util.promisify(glob);

async function getFilesDigets(dir) {
    log(`Reading files from %o`, dir);
    const files = await globFiles("**/*", { cwd: dir, nodir: true });
    const filePaths = files.map(file => {
        return {
            abs: path.join(dir, file),
            rel: file
        };
    });
    return await calculateHashes(filePaths);
}

async function calculateHashes(files) {
    await Promise.all(
        files.map(async file => {
            const content = await fs.readFile(file.abs);
            const sha = crypto.createHash("sha1");
            sha.update(content);
            file.hash = sha.digest("hex");
        })
    );

    return files;
}

export { getFilesDigets };
