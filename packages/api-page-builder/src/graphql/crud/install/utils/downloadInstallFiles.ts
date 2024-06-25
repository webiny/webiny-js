import fs from "fs-extra";
import extract from "extract-zip";
import path from "path";
import { GetObjectCommand, getSignedUrl, S3 } from "@webiny/aws-sdk/client-s3";
import download from "./download";

const PAGE_BUILDER_S3_BUCKET = process.env.S3_BUCKET;
const PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY = "pbInstallation.zip";

function extractZip(zipPath: string, dir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        extract(zipPath, { dir }, err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

export function deleteFile(path: string): Promise<void> {
    return fs.unlink(path);
}

const INSTALL_DIR = "/tmp";
const INSTALL_ZIP_PATH = path.join(INSTALL_DIR, "apiPageBuilder.zip");
const INSTALL_EXTRACT_DIR = path.join(INSTALL_DIR, "apiPageBuilder");

export default async () => {
    const s3 = new S3({ region: process.env.AWS_REGION });
    const installationFilesUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: PAGE_BUILDER_S3_BUCKET,
            Key: PAGE_BUILDER_INSTALLATION_FILES_ZIP_KEY
        })
    );

    fs.ensureDirSync(INSTALL_DIR);
    await download(installationFilesUrl, INSTALL_ZIP_PATH);

    await extractZip(INSTALL_ZIP_PATH, INSTALL_EXTRACT_DIR);
    await deleteFile(INSTALL_ZIP_PATH);

    return INSTALL_EXTRACT_DIR;
};

export interface DownloadAndExtractZipParams {
    zipFileKey: string;
    downloadZipAs: string;
    extractZipInDir: string;
    zipFileUrl: string;
}

export const downloadAndExtractZip = async ({
    zipFileKey,
    downloadZipAs,
    extractZipInDir,
    zipFileUrl
}: DownloadAndExtractZipParams) => {
    const s3 = new S3({ region: process.env.AWS_REGION });
    let installationFilesUrl;

    if (zipFileUrl) {
        installationFilesUrl = zipFileUrl;
    } else {
        installationFilesUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: PAGE_BUILDER_S3_BUCKET,
                Key: zipFileKey
            })
        );
    }

    fs.ensureDirSync(INSTALL_DIR);

    const zipPath = path.join(INSTALL_DIR, downloadZipAs);
    const extractDir = path.join(INSTALL_DIR, extractZipInDir);

    await download(installationFilesUrl, zipPath);

    await extractZip(zipPath, extractDir);
    await deleteFile(zipPath);

    return extractDir;
};
