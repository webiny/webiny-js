import download from "download";
import fs from "fs-extra";
import extract from "extract-zip";
import path from "path";
import rimraf from "rimraf";
import S3 from "aws-sdk/clients/s3";

function extractZip(zipPath, dir) {
    return new Promise((resolve, reject) => {
        extract(zipPath, { dir }, e => {
            if (e) {
                reject(e);
                return;
            }
            resolve();
        });
    });
}

function deleteFile(path) {
    return new Promise((resolve, reject) => {
        rimraf(path, e => {
            if (e) {
                reject(e);
                return;
            }
            resolve();
        });
    });
}

const INSTALL_DIR = "/tmp/installation-files";
const INSTALL_ZIP_PATH = path.join(INSTALL_DIR, "apiPageBuilder.zip");
const INSTALL_EXTRACT_DIR = path.join(INSTALL_DIR, "apiPageBuilder");

let downloaded = false;
export default async () => {
    if (downloaded) {
        return INSTALL_EXTRACT_DIR;
    }

    const s3 = new S3({ region: process.env.AWS_REGION });
    const installationFilesUrl = await s3.getSignedUrlPromise("getObject", {
        Bucket: "wby-pb-install",
        Key: "page_builder_install_files.zip"
    });

    fs.ensureDirSync(INSTALL_DIR);
    fs.writeFileSync(INSTALL_ZIP_PATH, await download(installationFilesUrl));

    await extractZip(INSTALL_ZIP_PATH, INSTALL_EXTRACT_DIR);
    await deleteFile(INSTALL_ZIP_PATH);

    return INSTALL_EXTRACT_DIR;
};
