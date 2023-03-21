// @ts-ignore
import mdbid from "mdbid";
import useGqlHandler from "./useGqlHandler";
import { fileLifecyclePlugin, lifecycleEventTracker } from "./mocks/lifecyclePlugin";

const WEBINY_VERSION = process.env.WEBINY_VERSION;

const TAG = "webiny";

enum FileLifecycle {
    BEFORE_CREATE = "file:beforeCreate",
    AFTER_CREATE = "file:afterCreate",
    BEFORE_UPDATE = "file:beforeUpdate",
    AFTER_UPDATE = "file:afterUpdate",
    BEFORE_BATCH_CREATE = "file:beforeBatchCreate",
    AFTER_BATCH_CREATE = "file:afterBatchCreate",
    BEFORE_DELETE = "file:beforeDelete",
    AFTER_DELETE = "file:afterDelete"
}

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
        plugins: [fileLifecyclePlugin]
    });
    const hookParamsExpected = {
        id: expect.any(String),
        createdOn: expect.stringMatching(/^20/),
        createdBy: {
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
        lifecycleEventTracker.reset();
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
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_UPDATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_UPDATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_BATCH_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_BATCH_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_DELETE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_DELETE)).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeCreate = lifecycleEventTracker.getLast(FileLifecycle.BEFORE_CREATE);
        expect(beforeCreate.params[0]).toEqual({
            context: expect.any(Object),
            data: {
                ...fileData,
                ...hookParamsExpected
            }
        });
        const afterCreate = lifecycleEventTracker.getLast(FileLifecycle.AFTER_CREATE);
        expect(afterCreate.params[0]).toEqual({
            context: expect.any(Object),
            data: {
                ...fileData,
                ...hookParamsExpected
            },
            file: {
                ...fileData,
                ...hookParamsExpected
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
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_UPDATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_UPDATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_BATCH_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_BATCH_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_DELETE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_DELETE)).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeUpdate = lifecycleEventTracker.getLast(FileLifecycle.BEFORE_UPDATE);
        expect(beforeUpdate.params[0]).toEqual({
            context: expect.any(Object),
            original: {
                ...fileData,
                ...hookParamsExpected,
                id: expect.any(String)
            },
            data: {
                ...fileData,
                ...hookParamsExpected,
                tags: [...fileData.tags, TAG]
            }
        });
        const afterUpdate = lifecycleEventTracker.getLast(FileLifecycle.AFTER_UPDATE);
        expect(afterUpdate.params[0]).toEqual({
            context: expect.any(Object),
            original: {
                ...fileData,
                ...hookParamsExpected,
                id: expect.any(String)
            },
            data: {
                ...fileData,
                ...hookParamsExpected,
                tags: [...fileData.tags, TAG]
            },
            file: {
                ...fileData,
                ...hookParamsExpected,
                tags: [...fileData.tags, TAG]
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
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_UPDATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_UPDATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_BATCH_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_BATCH_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_DELETE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_DELETE)).toEqual(1);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeDelete = lifecycleEventTracker.getLast(FileLifecycle.BEFORE_DELETE);
        expect(beforeDelete.params[0]).toEqual({
            context: expect.any(Object),
            file: {
                ...fileData,
                ...hookParamsExpected
            }
        });
        const afterDelete = lifecycleEventTracker.getLast(FileLifecycle.AFTER_DELETE);
        expect(afterDelete.params[0]).toEqual({
            context: expect.any(Object),
            file: {
                ...fileData,
                ...hookParamsExpected
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
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_CREATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_UPDATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_UPDATE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_BATCH_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_BATCH_CREATE)).toEqual(1);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.BEFORE_DELETE)).toEqual(0);
        expect(lifecycleEventTracker.getExecuted(FileLifecycle.AFTER_DELETE)).toEqual(0);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeBatchCreate = lifecycleEventTracker.getLast(FileLifecycle.BEFORE_BATCH_CREATE);
        expect(beforeBatchCreate.params[0]).toEqual({
            context: expect.any(Object),
            data: [
                {
                    ...fileData,
                    ...hookParamsExpected
                }
            ]
        });
        const afterBatchCreate = lifecycleEventTracker.getLast(FileLifecycle.AFTER_BATCH_CREATE);
        expect(afterBatchCreate.params[0]).toEqual({
            context: expect.any(Object),
            data: [
                {
                    ...fileData,
                    ...hookParamsExpected
                }
            ],
            files: [
                {
                    ...fileData,
                    ...hookParamsExpected
                }
            ]
        });
    });
});
