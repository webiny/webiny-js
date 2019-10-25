import get from "lodash.get";
import pick from "lodash.pick";
import blockFiles from "./importData/blockFiles";
import { ErrorResponse, Response } from "@webiny/api";
import { CREATE_FILE, UPLOAD_FILE } from "./utils/graphql";
import { GraphQLClient } from "graphql-request";
import download from "download";
import fs from "fs-extra";
import extract from "extract-zip";
import path from "path";
import rimraf from "rimraf";
import S3 from "aws-sdk/clients/s3";
import got from "got";
import FormData from "form-data";

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

function sleep() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 5);
    });
}

export const install = async (root: any, args: Object, context: Object) => {
    // Start the download of initial Page Builder page / block images.
    // eslint-disable-next-line
    const s3 = new S3({ region: process.env.AWS_REGION });

    const { PbSettings, PbCategory, PbMenu, PbPage, PbPageElement } = context.models;

    // 5. ⚠️ Save files.
    // Before continuing, let's make sure the download has finished.
    const installationFilesUrl = await s3.getSignedUrlPromise("getObject", {
        Bucket: "wby-pb-install",
        Key: "page_builder_install_files.zip"
    });

    fs.ensureDirSync(INSTALL_DIR);
    fs.writeFileSync(INSTALL_ZIP_PATH, await download(installationFilesUrl));

    await extractZip(INSTALL_ZIP_PATH, INSTALL_EXTRACT_DIR);
    await deleteFile(INSTALL_ZIP_PATH);

    let filesWithPreSignedPostPayload = [];

    const client = new GraphQLClient(process.env.FILES_API_URL, {
        headers: {
            Authorization: context.token
        }
    });

    for (let i = 0; i < blockFiles.length; i++) {
        await sleep();
        const file = blockFiles[i];
        filesWithPreSignedPostPayload.push(
            new Promise(resolve =>
                client
                    .request(UPLOAD_FILE, {
                        data: pick(file, ["name", "size", "type"])
                    })
                    .then(response => {
                        resolve({ response, __file: file });
                    })
            )
        );
    }

    // Wait for all to finish.
    await Promise.all(filesWithPreSignedPostPayload);

    const imageSaves = [];
    // 4.2 Upload all files to S3 using received pre-signed post payloads and save files via Files service.
    for (let i = 0; i < filesWithPreSignedPostPayload.length; i++) {
        await sleep();
        const current = await filesWithPreSignedPostPayload[i];

        imageSaves.push(
            new Promise((resolve, reject) => {
                const { file, data } = get(current, "response.files.uploadFile.data");
                const formData = new FormData();
                Object.keys(data.fields).forEach(key => {
                    formData.append(key, data.fields[key]);
                });

                formData.append(
                    "file",
                    fs.readFileSync(
                        path.join(
                            INSTALL_EXTRACT_DIR,
                            "blocks/images/",
                            current.__file.__physicalFileName
                        )
                    )
                );

                console.log("saljemo", { ...file, id: current.__file.id });
                got(data.url, {
                    method: "post",
                    body: formData
                })
                    .then(() =>
                        client
                            .request(CREATE_FILE, {
                                data: { ...file, id: current.__file.id }
                            })
                            .then(response => {
                                resolve({
                                    response,
                                    __physicalFileName: current.__file.__physicalFileName
                                });
                            })
                            .catch(reject)
                    )
                    .catch(reject);
            })
        );
    }

    await Promise.all(imageSaves);

    return;

    // 5. Finally, set "name", "domain" and "installed" values.
    const { name, domain } = args;
    settings.data.installed = true;
    settings.data.name = name;
    settings.data.domain = domain;
    await settings.save();
    return new Response(true);
};

export const isInstalled = async (root: any, args: Object, context: Object) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    return get(settings, "data.installed") || false;
};
