import { SecurityIdentity } from "@webiny/api-security";
import useGqlHandler from "./useGqlHandler";
import { SecurityPermission } from "@webiny/api-security/types";

jest.setTimeout(10000);

function Mock(prefix) {
    this.key = `${prefix}key`;
    this.type = `${prefix}type`;
    this.size = 4096;
    this.name = `${prefix}name`;
    this.tags = [`${prefix}tag`];
}

function MockResponse({ prefix, id }) {
    this.id = id;
    this.key = `${prefix}key`;
    this.type = `${prefix}type`;
    this.size = 4096;
    this.name = `${prefix}name`;
    this.tags = [`${prefix}tag`];
}

const NOT_AUTHORIZED_RESPONSE = operation => ({
    data: {
        fileManager: {
            [operation]: {
                data: null,
                error: {
                    code: "SECURITY_NOT_AUTHORIZED",
                    data: null,
                    message: "Not authorized!"
                }
            }
        }
    }
});

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

const identityB = new SecurityIdentity({
    id: "b",
    login: "b",
    type: "test",
    displayName: "Bb"
});

type IdentityPermissions = Array<[SecurityPermission[], SecurityIdentity]>;

describe("Files Security Test", () => {
    const { createFile, createFiles, until } = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "fm.*" }],
        identity: identityA
    });

    test(`"listFiles" only returns entries to which the identity has access to`, async () => {
        const [createFilesResponse] = await createFiles({
            data: [new Mock("list-files-1-"), new Mock("list-files-2-")]
        });

        const file1Id = createFilesResponse.data.fileManager.createFiles.data[0].id;
        const file2Id = createFilesResponse.data.fileManager.createFiles.data[1].id;

        const identityBHandler = useGqlHandler({ identity: identityB });
        const [identityBHandlerCreateFilesResponse] = await identityBHandler.createFiles({
            data: [new Mock("list-files-3-"), new Mock("list-files-4-")]
        });

        const file3Id = identityBHandlerCreateFilesResponse.data.fileManager.createFiles.data[0].id;
        const file4Id = identityBHandlerCreateFilesResponse.data.fileManager.createFiles.data[1].id;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file", rwd: "wd" }], identityA],
            [[{ name: "fm.file", rwd: "d" }], identityA],
            [[{ name: "fm.file", rwd: "w" }], identityA]
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
                                code: "SECURITY_NOT_AUTHORIZED",
                                data: null,
                                message: "Not authorized!"
                            }
                        }
                    }
                }
            });
        }

        const sufficientPermissionsAll: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fm.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.*" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listFiles } = useGqlHandler({ permissions, identity });

            await until(
                () =>
                    listFiles({
                        limit: 1000
                    }).then(([data]) => data),
                ({ data }) => {
                    return !!data.fileManager.listFiles.data.length;
                },
                { name: "sufficientPermissionsAll list all files", tries: 10 }
            );

            const [response] = await listFiles();
            expect(response).toEqual({
                data: {
                    fileManager: {
                        listFiles: {
                            data: [
                                new MockResponse({ prefix: "list-files-4-", id: file4Id }),
                                new MockResponse({ prefix: "list-files-3-", id: file3Id }),
                                new MockResponse({ prefix: "list-files-2-", id: file2Id }),
                                new MockResponse({ prefix: "list-files-1-", id: file1Id })
                            ],
                            meta: {
                                cursor: expect.any(String),
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
            permissions: [{ name: "content.i18n" }, { name: "fm.file", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listFiles();
        expect(response).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            new MockResponse({ prefix: "list-files-2-", id: file2Id }),
                            new MockResponse({ prefix: "list-files-1-", id: file1Id })
                        ],
                        meta: {
                            cursor: expect.any(String),
                            totalCount: expect.any(Number),
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "fm.file", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listFiles();
        expect(response).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            new MockResponse({ prefix: "list-files-4-", id: file4Id }),
                            new MockResponse({ prefix: "list-files-3-", id: file3Id })
                        ],
                        meta: {
                            cursor: expect.any(String),
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

            const [response] = await createFile({ data: new Mock("mock") });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("createFile"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fm.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createFile } = useGqlHandler({ permissions, identity });

            const data = new Mock(`file-create-${i}-`);
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
            const mock = new Mock("update-file-");

            const [createFileResponse] = await createFile({ data: mock });
            const fileId = createFileResponse.data.fileManager.createFile.data.id;

            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id: fileId, data: mock });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateFile"));
        }
    );
    const sufficientPermissions: IdentityPermissions = [
        [[{ name: "content.i18n" }, { name: "fm.file" }], identityA],
        [[{ name: "content.i18n" }, { name: "fm.file", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "fm.file", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rwd" }], identityA]
    ];

    test.each(sufficientPermissions)(
        `allow "updateFile" for permissions %j`,
        async (permissions, identity) => {
            const mock = new Mock("update-file-");

            const [createFileResponse] = await createFile({ data: mock });
            const fileId = createFileResponse.data.fileManager.createFile.data.id;

            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id: fileId, data: mock });
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
        const mock = new Mock("update-file-");

        const [createFileResponse] = await createFile({ data: mock });
        const fileId = createFileResponse.data.fileManager.createFile.data.id;

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
            const [response] = await updateFile({ id: fileId, data: mock });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateFile"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fm.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateFile } = useGqlHandler({ permissions, identity });
            const [response] = await updateFile({ id: fileId, data: mock });
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
        const mock = new Mock("get-file-");

        const [createFileResponse] = await createFile({ data: mock });
        const fileId = createFileResponse.data.fileManager.createFile.data.id;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file", rwd: "w" }], identityA],
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
            [[{ name: "content.i18n" }, { name: "fm.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fm.file", rwd: "rwd" }], identityA]
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
