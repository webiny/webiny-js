import { mdbid } from "@webiny/utils";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { assignFileLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { FM_FILE_TYPE, ROOT_FOLDER } from "~/contants";
import { addMimeTag } from "~/utils/createRecordPayload";

describe("Files -> Search records", () => {
    const { fileManager, search } = useGraphQlHandler({
        plugins: [assignFileLifecycleEvents()]
    });

    const createDummyFile = async (extra = {}) => {
        const id = mdbid();

        const fileData = {
            id,
            key: `${id}/filenameA.png`,
            name: "filenameA.png",
            size: 123456,
            type: "image/png",
            aliases: ["alias-1.jpg", "alias-2.jpg"],
            tags: ["file", "webiny"]
        };

        const [response] = await fileManager.createFile({ data: { ...fileData, ...extra } });

        const file = response.data?.fileManager?.createFile?.data;

        if (!file) {
            throw new Error(
                response.data?.fileManager?.error?.message ||
                    "unknown error while creating dummy file"
            );
        }
        return file;
    };

    beforeEach(async () => {
        tracker.reset();
    });

    it("should create a search record on file creation", async () => {
        const { id, key, size, type, name, createdBy, tags, meta, aliases } =
            await createDummyFile();

        expect(tracker.isExecutedOnce("file:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("file:afterCreate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            id,
            type: FM_FILE_TYPE,
            title: name,
            location: {
                folderId: ROOT_FOLDER
            },
            tags: addMimeTag(tags, type),
            data: {
                id,
                key,
                size,
                type,
                name,
                createdBy,
                aliases,
                meta
            }
        });
    });

    it("should NOT create a search record in case of `private` files", async () => {
        const { id } = await createDummyFile({ meta: { private: true } });

        expect(tracker.isExecutedOnce("file:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("file:afterCreate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id });
        const searchRecordResult = searchResponse.data?.search?.getRecord;

        expect(searchRecordResult).toMatchObject({
            data: null,
            error: {
                code: "NOT_FOUND",
                data: { id },
                message: "Record not found."
            }
        });
    });

    it("should create many search records on batch files creation", async () => {
        const file1 = {
            id: "file-1",
            key: `file-1/filenameA.png`,
            name: "filenameA.png",
            size: 123456,
            type: "image/png",
            tags: ["image", "file-1"],
            aliases: ["/any/alias"]
        };

        const file2 = {
            id: "file-2",
            key: `file-2/filenameA.png`,
            name: "filenameB.png",
            size: 987654,
            type: "image/png",
            tags: ["image", "file-2"],
            aliases: []
        };

        const [response] = await fileManager.createFiles({
            data: [file1, file2]
        });

        expect(response.errors).toBeFalsy();
        expect(tracker.isExecutedOnce("file:beforeBatchCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("file:afterBatchCreate")).toEqual(true);

        const [searchResponse1] = await search.getRecord({ id: file1.id });
        const searchRecord1 = searchResponse1.data?.search?.getRecord?.data;

        expect(searchRecord1).toMatchObject({
            id: file1.id,
            type: FM_FILE_TYPE,
            title: file1.name,
            location: {
                folderId: ROOT_FOLDER
            },
            tags: addMimeTag(file1.tags, file1.type),
            data: {
                id: file1.id,
                key: file1.key,
                size: file1.size,
                type: file1.type,
                name: file1.name,
                aliases: file1.aliases
            }
        });

        const [searchResponse2] = await search.getRecord({ id: file2.id });
        const searchRecord2 = searchResponse2.data?.search?.getRecord?.data;

        expect(searchRecord2).toMatchObject({
            id: file2.id,
            type: FM_FILE_TYPE,
            title: file2.name,
            location: {
                folderId: ROOT_FOLDER
            },
            tags: addMimeTag(file2.tags, file2.type),
            data: {
                id: file2.id,
                key: file2.key,
                size: file2.size,
                type: file2.type,
                name: file2.name,
                aliases: file2.aliases
            }
        });
    });

    it("should NOT batch create a search record in case of `private` files", async () => {
        const file1 = {
            id: "file-1",
            key: `file-1/filenameA.png`,
            name: "filenameA.png",
            size: 123456,
            type: "image/png",
            tags: ["image", "file-1"],
            aliases: ["/any/alias"],
            meta: {
                private: true
            }
        };

        const file2 = {
            id: "file-2",
            key: `file-2/filenameA.png`,
            name: "filenameB.png",
            size: 987654,
            type: "image/png",
            tags: ["image", "file-2"],
            aliases: []
        };

        await fileManager.createFiles({
            data: [file1, file2]
        });

        const [searchResponse1] = await search.getRecord({ id: file1.id });
        const searchRecordResult1 = searchResponse1.data?.search?.getRecord;

        expect(searchRecordResult1).toMatchObject({
            data: null,
            error: {
                code: "NOT_FOUND",
                data: { id: file1.id },
                message: "Record not found."
            }
        });

        const [searchResponse2] = await search.getRecord({ id: file2.id });
        const searchRecord2 = searchResponse2.data?.search?.getRecord?.data;

        expect(searchRecord2).toMatchObject({
            id: file2.id,
            type: FM_FILE_TYPE,
            title: file2.name,
            location: {
                folderId: ROOT_FOLDER
            },
            tags: addMimeTag(file2.tags, file2.type),
            data: {
                id: file2.id,
                key: file2.key,
                size: file2.size,
                type: file2.type,
                name: file2.name,
                meta: {
                    private: false
                },
                aliases: file2.aliases
            }
        });
    });

    it("should update an existing search record", async () => {
        const { id } = await createDummyFile();

        const [update] = await fileManager.updateFile({
            id,
            data: {
                tags: ["new-tag"]
            }
        });

        const updateFile = update.data?.fileManager?.updateFile?.data;

        expect(tracker.isExecutedOnce("file:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("file:afterUpdate")).toEqual(true);

        const [searchResponse] = await search.getRecord({ id });
        const searchRecord = searchResponse.data?.search?.getRecord?.data;

        expect(searchRecord).toMatchObject({
            id,
            title: updateFile.name,
            tags: addMimeTag(updateFile.tags, updateFile.type)
        });
    });

    it("should delete a search record on file deletion", async () => {
        const { id } = await createDummyFile();

        await fileManager.deleteFile({
            id
        });

        expect(tracker.isExecutedOnce("file:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("file:afterDelete")).toEqual(true);

        const [deletedResponse] = await search.getRecord({ id });

        expect(deletedResponse).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: {
                                id
                            }
                        }
                    }
                }
            }
        });
    });
});
