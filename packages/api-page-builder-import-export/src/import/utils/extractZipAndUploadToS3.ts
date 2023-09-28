import yauzl from "yauzl";
import { pipeline } from "stream";
import { promisify } from "util";
import { CompleteMultipartUploadOutput } from "@webiny/aws-sdk/client-s3";
import { s3Stream } from "~/export/s3Stream";
import { getFileNameWithoutExt } from "./getFileNameWithoutExt";
import { ImportData } from "~/types";
import { prepareDataDirMap } from "~/import/utils/prepareDataDirMap";

const FILE_CONTENT_TYPE = "application/octet-stream";
const streamPipeline = promisify(pipeline);

export function extractZipAndUploadToS3(
    dataZipFilePath: string,
    uniquePath: string
): Promise<ImportData> {
    return new Promise((resolve, reject) => {
        const filePaths = [];
        const fileUploadPromises: Promise<CompleteMultipartUploadOutput>[] = [];
        const uniqueKey = getFileNameWithoutExt(dataZipFilePath);
        let dataMap: ImportData = {
            key: uniqueKey,
            assets: {},
            data: ""
        };
        yauzl.open(dataZipFilePath, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                console.warn("ERROR: Failed to extract zip: ", dataZipFilePath, err);
                reject(err);
                return;
            }
            if (!zipFile) {
                console.log("ERROR: Probably failed to extract zip: " + dataZipFilePath);
                reject("Missing Zip File Resource.");
                return;
            }
            console.info(`The ZIP file contains ${zipFile.entryCount} entries.`);
            zipFile.on("end", function (err) {
                if (err) {
                    console.warn('ERROR: Failed on "END" for file: ', dataZipFilePath, err);
                    reject(err);
                }

                Promise.all(fileUploadPromises).then(res => {
                    res.forEach(r => {
                        console.info("Done uploading... ", r);
                    });
                    resolve(dataMap);
                });
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
                                "ERROR: Failed while performing [openReadStream] for file: ",
                                entry.fileName,
                                err
                            );
                            reject(err);
                            return;
                        }
                        if (!readStream) {
                            console.log("ERROR: Missing Read Stream while importing.");
                            reject("Missing Read Strea Resource.");
                            return;
                        }
                        readStream.on("end", function () {
                            filePaths.push(entry.fileName);
                            zipFile.readEntry();
                        });

                        const newKey = `${uniquePath}/${uniqueKey}/${entry.fileName}`;
                        // Modify in place
                        dataMap = prepareDataDirMap({
                            map: dataMap,
                            filePath: entry.fileName,
                            newKey
                        });

                        const { streamPassThrough, streamPassThroughUploadPromise: promise } =
                            s3Stream.writeStream(newKey, FILE_CONTENT_TYPE);

                        streamPipeline(readStream, streamPassThrough)
                            .then(() => {
                                fileUploadPromises.push(promise);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    });
                }
            });
        });
    });
}
