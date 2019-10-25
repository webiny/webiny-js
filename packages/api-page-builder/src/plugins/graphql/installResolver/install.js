import get from "lodash.get";
import pick from "lodash.pick";
import pbCategories from "./importData/PbCategory";
import blockFiles from "./importData/blockFiles";
import pbElements from "./importData/PbElement";
import { ErrorResponse, Response } from "@webiny/api";
import { CREATE_FILE, UPLOAD_FILE } from "./graphql";
import { GraphQLClient } from "graphql-request";
import fs from "fs-extra";
import path from "path";
import got from "got";
import FormData from "form-data";
import downloadInstallationFiles from "./utils/downloadInstallationFiles";

const INSTALL_DIR = "/tmp/installation-files";
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
    const { PbSettings, PbCategory, PbMenu, PbPage, PbPageElement } = context.models;

    // ✅ 1. Check if Page Builder is already installed.
    const settings = await PbSettings.load();
    /*if (settings.data.installed) {
        return new ErrorResponse({
            code: "PB_INSTALL_ABORTED",
            message: "Page builder is already installed."
        });
    }*/

    // ✅ 1.1 Let's immediately start the download of the installation files.
    const downloadInstallationFilesPromise = downloadInstallationFiles();

    // ✅ 2. Create "Static" page category.¡
    const staticPageCount = await PbCategory.count({ query: { slug: "static" } });
    if (staticPageCount === 0) {
        for (let i = 0; i < pbCategories.length; i++) {
            const instance = new PbCategory();
            await instance.populate(pbCategories[i]).save();
        }
    }

    // ✅ 3. Save page elements.
    for (let i = 0; i < pbElements.length; i++) {
        await sleep();
        const instance = new PbPageElement();
        await instance.populate(pbElements[i]).save();
    }

    // ⚠️ 4. Save pages.
    // TODO: WIP

    // 5. ⚠️ Save files.
    const client = new GraphQLClient(process.env.FILES_API_URL, {
        headers: {
            Authorization: context.token
        }
    });

    let filesWithPreSignedPostPayload = [];
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
    await downloadInstallationFilesPromise;
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

                got(data.url, {
                    method: "post",
                    body: formData
                })
                    .then(() =>
                        client
                            .request(CREATE_FILE, {
                                data: {
                                    meta: current.__file.meta,
                                    ...file,
                                    id: current.__file.id
                                }
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
