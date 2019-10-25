import get from "lodash.get";
import pick from "lodash.pick";
import elementsFilesData from "./../importData/elementsFilesData";
import elementsData from "./../importData/elementsData";
import { CREATE_FILE, UPLOAD_FILE } from "./graphql";
import { GraphQLClient } from "graphql-request";
import fs from "fs-extra";
import path from "path";
import uploadToS3 from "./uploadToS3";
import sleep from "./sleep";

export default async ({ context, INSTALL_EXTRACT_DIR }) => {
    const { PbPageElement } = context.models;

    // 1. Save page elements.
    const saving = [];
    for (let i = 0; i < elementsData.length; i++) {
        const instance = new PbPageElement();
        saving.push(instance.populate(elementsData[i]).save());
    }

    await console.log("saveElements: instances");

    // 2. Save files.
    // 2.1 Get pre-signed POST payloads.
    const client = new GraphQLClient(process.env.FILES_API_URL, {
        headers: {
            Authorization: context.token
        }
    });

    let filesWithPreSignedPostPayload = [];
    for (let i = 0; i < elementsFilesData.length; i++) {
        await sleep();
        const elementsFileData = elementsFilesData[i];
        filesWithPreSignedPostPayload.push(
            client
                .request(UPLOAD_FILE, {
                    data: pick(elementsFileData, ["name", "size", "type"])
                })
                .then(async response => {
                    const { file, data } = get(response, "files.uploadFile.data");
                    const buffer = fs.readFileSync(
                        path.join(INSTALL_EXTRACT_DIR, "blocks/images/", elementsFileData.__physicalFileName)
                    );

                    return uploadToS3(buffer, data).then(() =>
                        client.request(CREATE_FILE, {
                            data: {
                                meta: elementsFileData.meta,
                                ...file,
                                id: elementsFileData.id
                            }
                        })
                    );
                })
        );
    }

    // Wait for all to finish.
    await console.log("saveElements: gotovo!");
    return Promise.all([...filesWithPreSignedPostPayload, ...saving]);
};
