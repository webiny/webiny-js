import { describe, test, expect } from "vitest";
import { mdbid } from "@webiny/utils";
import useGqlHandler from "~tests/utils/useGqlHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

function createFileMock(prefix = "") {
    const id = mdbid();

    const keyPrefix = prefix ? `/${prefix}` : "";

    return {
        id,
        key: `${id}${keyPrefix}/filenameA.png`,
        name: "filenameA.png",
        size: 123456,
        type: "image/png",
        tags: ["sketch", "file-a", "webiny"]
    };
}

const NOT_AUTHORIZED_RESPONSE = (operation: string) => ({
    data: {
        fileManager: {
            [operation]: {
                data: null,
                error: {
                    code: "FileManager/File/NotAuthorizedError",
                    data: null,
                    message: "Not authorized."
                }
            }
        }
    }
});

const identityA: IdentityData = {
    id: "a",
    type: "test",
    displayName: "Aa"
};

const identityB: IdentityData = {
    id: "b",
    type: "test",
    displayName: "Bb"
};

type IdentityPermissions = Array<[SecurityPermission[], IdentityData | null]>;

describe("Files Security Test", { timeout: 10_000 }, () => {
    const { createFile, createFiles, until } = useGqlHandler({
        permissions: [{ name: "fm.*" }],
        identity: identityA
    });

    test(`"listFiles" only returns entries to which the identity has access to`, async () => {
        const file1 = createFileMock("list-files-1-");
        const file2 = createFileMock("list-files-2-");
        const file3 = createFileMock("list-files-3-");
        const file4 = createFileMock("list-files-4-");

        await createFiles({
            data: [file1, file2]
        });

        const identityBHandler = useGqlHandler({ identity: identityB });
        await identityBHandler.createFiles({
            data: [file3, file4]
        });

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file", rwd: "wd" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listFiles } = useGqlHandler({ permissions, identity });
            const [response] = await listFiles();
            expect(response).toEqual({
                data: {
                    fileManager: {
                        listFiles: {
                            data: null,
                            meta: null,
                            error: {
                                code: "FileManager/File/NotAuthorizedError",
                                data: null,
                                message: "Not authorized."
                            }
                        }
                    }
                }
            });
        }

        const sufficientPermissionsAll: IdentityPermissions = [
            [[{ name: "fm.file" }], identityA],
            [[{ name: "fm.file", rwd: "r" }], identityA],
            [[{ name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "fm.file", rwd: "rwd" }], identityA],
            [[{ name: "fm.*" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listFiles } = useGqlHandler({ permissions, identity });

            await until(
                () =>
                    listFiles({
                        limit: 1000
                    }).then(([data]) => data),
                ({ data }: any) => {
                    return !!data.fileManager.listFiles.data.length;
                },
                { name: "sufficientPermissionsAll list all files", tries: 10 }
            );

            const [response] = await listFiles();
            expect(response).toEqual({
                data: {
                    fileManager: {
                        listFiles: {
                            data: [file4, file3, file2, file1],
                            meta: {
                                cursor: null,
                                totalCount: expect.any(Number),
                                hasMoreItems: false
                            },
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "fm.file", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listFiles();
        expect(response).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [file2, file1],
                        meta: {
                            cursor: null,
                            totalCount: expect.any(Number),
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "fm.file", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listFiles();
        expect(response).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [file4, file3],
                        meta: {
                            cursor: null,
                            totalCount: expect.any(Number),
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
    });

    test(`allow "createFile" if identity has sufficient permissions`, async () => {
        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file", own: false, rwd: "r" }], identityA],
            [[{ name: "fm.file", own: false, rwd: "rd" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createFile } = useGqlHandler({ permissions, identity });

            const [response] = await createFile({ data: createFileMock("mock") });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("createFile"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "fm.file" }], identityA],
            [[{ name: "fm.file", own: true }], identityA],
            [[{ name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "fm.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createFile } = useGqlHandler({ permissions, identity });

            const data = createFileMock(`file-create-${i}-`);
            const [response] = await createFile({ data });
            expect(response).toEqual({
                data: {
                    fileManager: {
                        createFile: {
                            data: { ...data, id: response.data.fileManager.createFile.data.id },
                            error: null
                        }
                    }
                }
            });
        }
    });

    const insufficientPermissions: IdentityPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "fm.file", rwd: "r" }], identityA],
        [[{ name: "fm.file", rwd: "rd" }], identityA],
        [[{ name: "fm.file", own: true }], identityB]
    ];

    test.each(insufficientPermissions)(
        `forbid "updateFile" for permissions %j`,
        async (permissions, identity) => {
            const mock = createFileMock("update-file-");
            const { id, ...data } = mock;

            await createFile({ data: mock });
            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id, data });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateFile"));
        }
    );
    const sufficientPermissions: IdentityPermissions = [
        [[{ name: "fm.file" }], identityA],
        [[{ name: "fm.file", own: true }], identityA],
        [[{ name: "fm.file", rwd: "rw" }], identityA],
        [[{ name: "fm.file", rwd: "rwd" }], identityA]
    ];

    test.each(sufficientPermissions)(
        `allow "updateFile" for permissions %j`,
        async (permissions, identity) => {
            const mock = createFileMock("update-file-");
            const { id, ...data } = mock;

            await createFile({ data: mock });

            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id, data });
            expect(response).toEqual({
                data: {
                    fileManager: {
                        updateFile: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    );

    test(`allow "updateFile" if identity has sufficient permissions`, async () => {
        const mock = createFileMock("update-file-");
        const { id, ...data } = mock;

        await createFile({ data: mock });

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file", rwd: "r" }], identityA],
            [[{ name: "fm.file", rwd: "rd" }], identityA],
            [[{ name: "fm.file", own: true }], identityB]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id, data });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateFile"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "fm.file" }], identityA],
            [[{ name: "fm.file", own: true }], identityA],
            [[{ name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "fm.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id, data });
            expect(response).toEqual({
                data: {
                    fileManager: {
                        updateFile: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "getFile" if identity has sufficient permissions`, async () => {
        const mock = createFileMock("get-file-");

        const [createFileResponse] = await createFile({ data: mock });
        const fileId = createFileResponse.data.fileManager.createFile.data.id;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file", rwd: "wd" }], identityA],
            [[{ name: "fm.file", own: true }], identityB]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { getFile } = useGqlHandler({ permissions, identity });
            const [response] = await getFile({ id: fileId });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("getFile"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "fm.file" }], identityA],
            [[{ name: "fm.file", own: true }], identityA],
            [[{ name: "fm.file", rwd: "r" }], identityA],
            [[{ name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "fm.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { getFile } = useGqlHandler({ permissions, identity });
            const [response] = await getFile({ id: fileId });
            expect(response).toEqual({
                data: {
                    fileManager: {
                        getFile: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    });
});
