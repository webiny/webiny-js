import get from "lodash.get";
import pick from "lodash.pick";
import pagesFilesData from "./../importData/pagesFilesData";
import pagesData from "./../importData/pagesData";
import { CREATE_FILE, UPLOAD_FILE } from "./graphql";
import { GraphQLClient } from "graphql-request";
import fs from "fs-extra";
import path from "path";
import uploadToS3 from "./uploadToS3";
import sleep from "./sleep";

export default async ({ context, INSTALL_EXTRACT_DIR }) => {
    const { PbPage } = context.models;

    // 1. Save page pages.
    const saving = [];
    for (let i = 0; i < pagesData.length; i++) {
        const instance = new PbPage();
        saving.push(instance.populate(pagesData[i]).save());
    }

    await console.log("savePages: instances are being saved.");

    // 2. Save files.
    // 2.1 Get pre-signed POST payloads.
    const client = new GraphQLClient(process.env.FILES_API_URL, {
        headers: {
            Authorization: context.token
        }
    });

    let filesWithPreSignedPostPayload = [];
    for (let i = 0; i < pagesFilesData.length; i++) {
        await sleep();
        const pagesFileData = pagesFilesData[i];
        filesWithPreSignedPostPayload.push(
            client
                .request(UPLOAD_FILE, {
                    data: pick(pagesFileData, ["name", "size", "type"])
                })
                .then(async response => {
                    const { file, data } = get(response, "files.uploadFile.data");
                    const buffer = fs.readFileSync(
                        path.join(
                            INSTALL_EXTRACT_DIR,
                            "pages/images/",
                            pagesFileData.__physicalFileName
                        )
                    );

                    return uploadToS3(buffer, data).then(() =>
                        client.request(CREATE_FILE, {
                            data: {
                                meta: pagesFileData.meta,
                                ...file,
                                id: pagesFileData.id
                            }
                        })
                    );
                })
        );
    }

    // Wait for all to finish.
    await console.log("savePages: process done.");
    return Promise.all([...filesWithPreSignedPostPayload, ...saving]);
};
