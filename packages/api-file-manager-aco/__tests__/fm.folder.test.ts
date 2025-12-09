import { describe, it, expect } from "vitest";
import { mdbid } from "@webiny/utils";
import { folderMocks } from "./mocks/folder.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";

const createSampleFileData = (overrides: Record<string, any> = {}) => {
    const id = mdbid();
    return {
        id,
        type: "image/jpeg",
        name: "image-48.jpg",
        size: 269965,
        key: `${id}/image.jpg`,
        tags: [],
        location: {
            folderId: ""
        },
        ...overrides
    };
};

describe("`folder` CRUD", () => {
    it("should NOT delete `FmFile` folder in case has child file", async () => {
        const { fm, aco } = useGraphQlHandler({});

        // Let's create a folder.
        const [folderResponse] = await aco.createFolder({
            data: { ...folderMocks.folderA, type: "FmFile" }
        });
        const folder = folderResponse.data.aco.createFolder.data;

        // Let's create a file within the folder.
        const [fileResponse] = await fm.createFile({
            data: {
                ...createSampleFileData(),
                location: {
                    folderId: folder.id
                }
            }
        });

        const file = fileResponse.data.fileManager.createFile.data;

        // Let's try to delete the folder.
        const [failedResponse] = await aco.deleteFolder({ id: folder.id });

        expect(failedResponse).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: null,
                        error: expect.objectContaining({
                            code: "Aco/Folder/NotEmpty",
                            data: null,
                            message: "Folder is not empty."
                        })
                    }
                }
            }
        });

        // Let's delete the file.
        await fm.deleteFile({
            id: file.id
        });

        const [succesfullResponse] = await aco.deleteFolder({ id: folder.id });

        expect(succesfullResponse).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Let's list folders.
        const [listFolderResponse] = await aco.listFolders({ where: { type: "FmFile" } });

        expect(listFolderResponse).toEqual({
            data: {
                aco: {
                    listFolders: {
                        data: [],
                        error: null,
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 0
                        }
                    }
                }
            }
        });
    });
});
