import { mdbid } from "@webiny/utils";
import useGqlHandler from "~tests/utils/useGqlHandler";
import { assignFileLifecycleEvents, tracker } from "./mocks/lifecycleEvents";
import { ROOT_FOLDER } from "~/contants";

const WEBINY_VERSION = process.env.WEBINY_VERSION;

const TAG = "webiny";

const id = mdbid();

const fileData = {
    id,
    key: `${id}/filenameA.png`,
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch"],
    aliases: []
};

describe("File lifecycle events", () => {
    const { createFile, updateFile, createFiles, deleteFile } = useGqlHandler({
        plugins: [assignFileLifecycleEvents()]
    });

    const hookParamsExpected = {
        id: expect.any(String),
        createdOn: expect.stringMatching(/^20/),
        savedOn: expect.stringMatching(/^20/),
        createdBy: {
            id: "12345678",
            displayName: "John Doe",
            type: "admin"
        },
        savedBy: {
            id: "12345678",
            displayName: "John Doe",
            type: "admin"
        },
        tenant: "root",
        locale: "en-US",
        meta: {
            private: false
        },
        webinyVersion: WEBINY_VERSION
    };

    beforeEach(() => {
        tracker.reset();
    });

    test(`it should call "beforeCreate" and "afterCreate" methods`, async () => {
        const [createResponse] = await createFile({ data: fileData });
        /**
         * We expect that file was created.
         */
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileData,
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeUpdate")).toEqual(0);
        expect(tracker.getExecuted("file:afterUpdate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeBatchCreate")).toEqual(0);
        expect(tracker.getExecuted("file:afterBatchCreate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeDelete")).toEqual(0);
        expect(tracker.getExecuted("file:afterDelete")).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeCreate = tracker.getLast("file:beforeCreate");
        expect(beforeCreate && beforeCreate.params[0]).toMatchObject({
            file: {
                ...fileData,
                ...hookParamsExpected,
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            }
        });
        const afterCreate = tracker.getLast("file:beforeCreate");
        expect(afterCreate && afterCreate.params[0]).toMatchObject({
            file: {
                ...fileData,
                ...hookParamsExpected,
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            }
        });
    });

    test(`it should call "beforeUpdate" and "afterUpdate" methods`, async () => {
        const [createResponse] = await createFile({ data: fileData });
        const id = createResponse.data.fileManager.createFile.data.id;

        const [updateResponse] = await updateFile({
            id,
            data: {
                tags: [...fileData.tags, TAG]
            }
        });
        expect(updateResponse).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: {
                            ...fileData,
                            tags: [...fileData.tags, TAG]
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeUpdate")).toEqual(1);
        expect(tracker.getExecuted("file:afterUpdate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeBatchCreate")).toEqual(0);
        expect(tracker.getExecuted("file:afterBatchCreate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeDelete")).toEqual(0);
        expect(tracker.getExecuted("file:afterDelete")).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeUpdate = tracker.getLast("file:beforeUpdate");
        expect(beforeUpdate && beforeUpdate.params[0]).toMatchObject({
            input: { tags: [...fileData.tags, TAG] },
            original: {
                ...fileData,
                ...hookParamsExpected,
                id: expect.any(String),
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            },
            file: {
                ...fileData,
                ...hookParamsExpected,
                tags: [...fileData.tags, TAG],
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            }
        });
        const afterUpdate = tracker.getLast("file:afterUpdate");
        expect(afterUpdate && afterUpdate.params[0]).toMatchObject({
            input: { tags: [...fileData.tags, TAG] },
            original: {
                ...fileData,
                ...hookParamsExpected,
                id: expect.any(String),
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            },
            file: {
                ...fileData,
                ...hookParamsExpected,
                tags: [...fileData.tags, TAG],
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            }
        });
    });

    test(`it should call "beforeDelete" and "afterDelete" methods`, async () => {
        const [createResponse] = await createFile({ data: fileData });
        const id = createResponse.data.fileManager.createFile.data.id;

        const [deleteResponse] = await deleteFile({
            id
        });
        expect(deleteResponse).toEqual({
            data: {
                fileManager: {
                    deleteFile: {
                        data: true,
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeUpdate")).toEqual(0);
        expect(tracker.getExecuted("file:afterUpdate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeBatchCreate")).toEqual(0);
        expect(tracker.getExecuted("file:afterBatchCreate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeDelete")).toEqual(1);
        expect(tracker.getExecuted("file:afterDelete")).toEqual(1);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeDelete = tracker.getLast("file:beforeDelete");
        expect(beforeDelete && beforeDelete.params[0]).toEqual({
            file: {
                ...fileData,
                ...hookParamsExpected,
                modifiedOn: null,
                modifiedBy: null,
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            }
        });
        const afterDelete = tracker.getLast("file:afterDelete");
        expect(afterDelete && afterDelete.params[0]).toEqual({
            file: {
                ...fileData,
                ...hookParamsExpected,
                modifiedOn: null,
                modifiedBy: null,
                location: {
                    folderId: ROOT_FOLDER
                },
                savedOn: expect.any(String)
            }
        });
    });

    test(`it should call "beforeCreateBatch" and "afterCreateBatch" methods`, async () => {
        const [createBatchResponse] = await createFiles({
            data: [fileData]
        });
        expect(createBatchResponse).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: [
                            {
                                ...fileData,
                                id: expect.any(String)
                            }
                        ],
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeCreate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeUpdate")).toEqual(0);
        expect(tracker.getExecuted("file:afterUpdate")).toEqual(0);
        expect(tracker.getExecuted("file:beforeBatchCreate")).toEqual(1);
        expect(tracker.getExecuted("file:afterBatchCreate")).toEqual(1);
        expect(tracker.getExecuted("file:beforeDelete")).toEqual(0);
        expect(tracker.getExecuted("file:afterDelete")).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeBatchCreate = tracker.getLast("file:beforeBatchCreate");
        expect(beforeBatchCreate && beforeBatchCreate.params[0]).toEqual({
            files: [
                {
                    ...fileData,
                    ...hookParamsExpected,
                    modifiedOn: null,
                    modifiedBy: null,
                    location: {
                        folderId: ROOT_FOLDER
                    },
                    savedOn: expect.any(String)
                }
            ]
        });
        const afterBatchCreate = tracker.getLast("file:afterBatchCreate");
        expect(afterBatchCreate && afterBatchCreate.params[0]).toEqual({
            files: [
                {
                    ...fileData,
                    ...hookParamsExpected,
                    modifiedOn: null,
                    modifiedBy: null,
                    location: {
                        folderId: ROOT_FOLDER
                    },
                    savedOn: expect.any(String)
                }
            ]
        });
    });
});
