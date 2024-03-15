import { pipeline } from "stream";
import { promisify } from "util";
import fetch from "node-fetch";
import path from "path";
import yauzl from "yauzl";
import { createWriteStream } from "fs";
import uniqueId from "uniqid";
import WebinyError from "@webiny/error";
import { deleteFile } from "@webiny/api-page-builder/graphql/crud/install/utils/downloadInstallFiles";
import { extractZipAndUploadToS3 } from "~/import/utils/extractZipAndUploadToS3";
import { getFileNameWithoutExt } from "~/import/utils/getFileNameWithoutExt";
import { ImportData } from "~/types";
import { INSTALL_DIR } from "~/import/constants";
import { ensureDirSync } from "fs-extra";

const streamPipeline = promisify(pipeline);

/**
 * Function will read the given zip file from S3 via stream, extract its content and upload it to S3 bucket.
 * @param zipFileUrl
 * @return ImportData S3 file keys for all uploaded assets group by page/block.
 */
export async function extractAndUploadZipFileContents(zipFileUrl: string): Promise<ImportData[]> {
    const log = console.log;
    const importDataList: ImportData[] = [];

    const zipFileName = path.basename(zipFileUrl).split("?")[0];

    const response = await fetch(zipFileUrl);
    const readStream = response.body;
    if (!response.ok || !readStream) {
        throw new WebinyError(`Unable to downloading file: "${zipFileUrl}"`, response.statusText);
    }

    const uniquePath = uniqueId("IMPORTS/");
    // Read export file and download it in the disk
    const ZIP_FILE_PATH = path.join(INSTALL_DIR, zipFileName);

    const writeStream = createWriteStream(ZIP_FILE_PATH);

    await streamPipeline(readStream, writeStream);
    log(`Downloaded file "${zipFileName}" at ${ZIP_FILE_PATH}`);

    // Extract the downloaded zip file
    const zipFilePaths = await extractZipToDisk(ZIP_FILE_PATH);

    log(`Removing ZIP file "${zipFileUrl}" from ${ZIP_FILE_PATH}`);
    await deleteFile(ZIP_FILE_PATH);

    /**
     * TODO: Possibly do this in parallel?
     */
    // Extract each page/block zip and upload their content's to S3
    for (const currentPath of zipFilePaths) {
        const dataMap = await extractZipAndUploadToS3(currentPath, uniquePath);
        importDataList.push(dataMap);
    }
    // TODO @pavel why?
    log("Removing all ZIP files located at ", path.dirname(zipFilePaths[0]));
    await deleteFile(path.dirname(zipFilePaths[0]));

    return importDataList;
}

function extractZipToDisk(exportFileZipPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const zipFilePaths: string[] = [];
        const uniqueFolderNameForExport = getFileNameWithoutExt(exportFileZipPath);
        const EXPORT_FILE_EXTRACTION_PATH = path.join(INSTALL_DIR, uniqueFolderNameForExport);
        // Make sure DIR exists
        ensureDirSync(EXPORT_FILE_EXTRACTION_PATH);

        yauzl.open(exportFileZipPath, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                console.warn("ERROR: Failed to extract zip: ", exportFileZipPath, err);
                reject(err);
                return;
            }
            if (!zipFile) {
                console.log("ERROR: Missing zip file resource for path: " + exportFileZipPath);
                reject("Missing Zip File Resource.");
                return;
            }

            console.info(`The ZIP file contains ${zipFile.entryCount} entries.`);

            zipFile.on("end", function (err) {
                if (err) {
                    console.warn("ERROR: Failed on END event for file: ", exportFileZipPath, err);
                    reject(err);
                }
                resolve(zipFilePaths);
            });

            zipFile.readEntry();

            zipFile.on("entry", function (entry) {
                console.info(`Processing entry: "${entry.fileName}"`);
                if (/\/$/.test(entry.fileName)) {
                    // Directory file names end with '/'.
                    // Note that entries for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    zipFile.readEntry();
                } else {
                    // file entry
                    zipFile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            console.warn(
                                "ERROR: Failed to openReadStream for file: ",
                                entry.fileName,
                                err
                            );
                            reject(err);
                            return;
                        }
                        if (!readStream) {
                            console.log(
                                "ERROR: Missing Read Stream Resource when extracting to disk."
                            );
                            reject("Missing Read Stream Resource.");
                            return;
                        }

                        const filePath = path.join(EXPORT_FILE_EXTRACTION_PATH, entry.fileName);

                        readStream.on("end", function () {
                            zipFilePaths.push(filePath);
                            zipFile.readEntry();
                        });

                        streamPipeline(readStream, createWriteStream(filePath)).catch(error => {
                            reject(error);
                        });
                    });
                }
            });
        });
    });
}
