import { validation } from "@webiny/validation";
import { withFields, string, number, setOnce, onSet } from "@commodo/fields";
import { object } from "commodo-fields-object";
import mdbid from "mdbid";

import { File, FilesCRUD } from "../../types";
import defaults from "./defaults";
import { FileManagerContextPlugin } from "../context";

const getFileDocForES = (file: File & { [key: string]: any }, locale: string) => ({
    id: file.id,
    createdOn: file.createdOn,
    key: file.key,
    size: file.size,
    type: file.type,
    name: file.name,
    tags: file.tags,
    createdBy: file.createdBy,
    meta: file.meta,
    locale: locale
});

const CreateDataModel = withFields({
    key: setOnce()(string({ validation: validation.create("required,maxLength:200") })),
    name: string({ validation: validation.create("maxLength:100") }),
    size: number(),
    type: string({ validation: validation.create("maxLength:50") }),
    meta: object(),
    tags: onSet(value => {
        if (!Array.isArray(value)) {
            return null;
        }

        return value.map(item => item.toLowerCase());
    })(
        string({
            list: true,
            validation: tags => {
                if (!Array.isArray(tags)) {
                    return;
                }

                if (tags.length > 15) {
                    throw Error("You cannot set more than 15 tags.");
                }

                for (let i = 0; i < tags.length; i++) {
                    const tag = tags[i];
                    if (typeof tag !== "string") {
                        throw Error("Tag must be typeof string.");
                    }

                    if (tag.length > 50) {
                        throw Error(`Tag ${tag} is more than 50 characters long.`);
                    }
                }
            }
        })
    )
})();

const UpdateDataModel = withFields({
    key: setOnce()(string({ validation: validation.create("maxLength:200") })),
    name: string({ validation: validation.create("maxLength:100") }),
    size: number(),
    type: string({ validation: validation.create("maxLength:50") }),
    meta: object(),
    tags: onSet(value => {
        if (!Array.isArray(value)) {
            return null;
        }

        return value.map(item => item.toLowerCase());
    })(
        string({
            list: true,
            validation: tags => {
                if (!Array.isArray(tags)) {
                    return;
                }

                if (tags.length > 15) {
                    throw Error("You cannot set more than 15 tags.");
                }

                for (let i = 0; i < tags.length; i++) {
                    const tag = tags[i];
                    if (typeof tag !== "string") {
                        throw Error("Tag must be typeof string.");
                    }

                    if (tag.length > 50) {
                        throw Error(`Tag ${tag} is more than 50 characters long.`);
                    }
                }
            }
        })
    )
})();

export default (context: FileManagerContextPlugin) => {
    const { db, i18nContent, elasticSearch } = context;
    const localeCode = i18nContent?.locale?.code;
    const PK_FILE = `F#${localeCode}`;

    return {
        async getFile(id: string) {
            // @ts-ignore
            const [[file]] = await db.read<File>({
                ...defaults.db,
                query: { PK: PK_FILE, SK: id },
                limit: 1
            });

            return file;
        },
        async listFiles(args) {
            // @ts-ignore
            const [files] = await db.read<File>({
                ...defaults.db,
                query: { PK: PK_FILE, SK: { $gt: " " } },
                ...args
            });

            return files;
        },
        async createFile(data) {
            const identity = context.security.getIdentity();

            const fileData = new CreateDataModel().populate(data);
            await fileData.validate();

            const id = mdbid();

            const file = {
                id,
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                ...(await fileData.toJSON())
            };
            // Save file to DB.
            await db.create({
                data: {
                    PK: PK_FILE,
                    SK: file.id,
                    TYPE: "fileManager:file",
                    ...file
                }
            });
            // Index file to "ElasticSearch".
            await elasticSearch.create({
                ...defaults.es,
                id,
                body: getFileDocForES(file, localeCode)
            });

            return file;
        },
        async updateFile(id, data) {
            const updatedFileData = new UpdateDataModel().populate(data);

            await updatedFileData.validate();

            const updateFile = await updatedFileData.toJSON({ onlyDirty: true });

            // update "savedOn"
            updateFile.savedOn = new Date().toISOString();

            await db.update({
                ...defaults.db,
                query: { PK: PK_FILE, SK: id },
                data: updateFile
            });

            // Index file in "Elastic Search"
            await elasticSearch.update({
                ...defaults.es,
                id,
                body: {
                    doc: updateFile
                }
            });

            return updateFile;
        },
        async deleteFile(id: string) {
            // Delete from DB.
            await db.delete({
                ...defaults.db,
                query: { PK: PK_FILE, SK: id }
            });
            // Delete index form ES.
            await elasticSearch.delete({
                ...defaults.es,
                id
            });
            return true;
        },
        async createFilesInBatch(data) {
            const identity = context.security.getIdentity();

            const createFileData = [];
            const files = [];

            for (let i = 0; i < data.length; i++) {
                const fileData = data[i];

                const fileInstance = new CreateDataModel().populate(fileData);
                await fileInstance.validate();

                const file = await fileInstance.toJSON();
                // Add unique id.
                file.id = mdbid();
                // Add "createdBy"
                file.createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };

                files.push(file);

                createFileData.push({
                    data: {
                        PK: PK_FILE,
                        SK: file.id,
                        ...file
                    }
                });
            }

            // Use "Batch write" to save files in DB.
            const batch = db.batch();
            batch.create(...createFileData);
            await batch.execute();

            // Index files in ES.
            const body = files.flatMap(doc => [
                { index: { _index: defaults.es.index } },
                getFileDocForES(doc, localeCode)
            ]);

            const { body: bulkResponse } = await elasticSearch.bulk({ body });
            if (bulkResponse.errors) {
                const erroredDocuments = [];
                // The items array has the same order of the dataset we just indexed.
                // The presence of the `error` key indicates that the operation
                // that we did for the document has failed.
                bulkResponse.items.forEach((action, i) => {
                    const operation = Object.keys(action)[0];
                    if (action[operation].error) {
                        erroredDocuments.push({
                            // If the status is 429 it means that you can retry the document,
                            // otherwise it's very likely a mapping error, and you should
                            // fix the document before to try it again.
                            status: action[operation].status,
                            error: action[operation].error,
                            operation: body[i * 2],
                            document: body[i * 2 + 1]
                        });
                    }
                });
                console.warn("Bulk index of files failed.");
                console.log(erroredDocuments);
            }

            return files;
        }
    } as FilesCRUD;
};
