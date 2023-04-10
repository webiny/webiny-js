import { File } from "@webiny/api-file-manager/types";

import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { assignPageLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { FM_FILE_TYPE, ROOT_FOLDER } from "~/contants";

const id = "any-id";

const fileData = {
    id,
    key: `${id}/filenameA.png`,
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["file", "webiny"],
    aliases: []
};

describe("Files -> Search records", () => {
    const { fileManager, search } = useGraphQlHandler({
        plugins: [assignPageLifecycleEvents()]
    });

    const createDummyFile = async () => {
        const [response] = await fileManager.createFile({ data: fileData });

        const file = response.data?.fileManager?.createFile?.data;

        if (!file) {
            throw new Error(
                response.data?.fileManager?.error?.message ||
                    "unknown error while creating dummy file"
            );
        }
        return file;
    };

    let dummyFile: File;

    beforeEach(async () => {
        dummyFile = await createDummyFile();
        tracker.reset();
    });

    it("should create a search record on file creation", async () => {
        const { id, key, size, type, name, createdOn, createdBy, tags, meta } =
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
            data: {
                id,
                key,
                size,
                type,
                name,
                createdOn,
                createdBy,
                tags,
                meta
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
            meta: { any: "meta" },
            aliases: []
        };

        await fileManager.createFiles({
            data: [file1, file2]
        });

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
            data: {
                id: file1.id,
                key: file1.key,
                size: file1.size,
                type: file1.type,
                name: file1.name,
                tags: file1.tags
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
            data: {
                id: file2.id,
                key: file2.key,
                size: file2.size,
                type: file2.type,
                name: file2.name,
                tags: file2.tags,
                meta: file2.meta
            }
        });
    });

    it("should update an existing search record", async () => {
        const { id } = dummyFile;

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
            data: {
                tags: updateFile.tags
            }
        });
    });

    it("should delete a search record on file deletion", async () => {
        const { id } = dummyFile;

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
