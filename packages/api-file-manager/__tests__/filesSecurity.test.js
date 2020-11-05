import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security";

function Mock(prefix) {
    this.key = `${prefix}key`;
    this.type = `${prefix}type`;
    this.size = 4096;
    this.name = `${prefix}name`;
    this.tags = [`${prefix}tag`];
}

const NOT_AUTHORIZED_RESPONSE = operation => ({
    data: {
        files: {
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

const defaultHandler = useGqlHandler({
    permissions: [{ name: "content.i18n" }, { name: "files.*" }],
    identity: identityA
});

describe("Files Security Test", () => {
    test(`"listFiles" only returns entries to which the identity has access to`, async () => {
        const { createFiles } = defaultHandler;
        const [createFilesResponse] = await createFiles({
            data: [new Mock("list-files-1-"), new Mock("list-files-2-")]
        });

        const file1Id = createFilesResponse.data.files.createFiles.data[0].id;
        const file2Id = createFilesResponse.data.files.createFiles.data[1].id;

        const identityBHandler = useGqlHandler({ identity: identityB });
        const [identityBHandlerCreateFilesResponse] = await identityBHandler.createFiles({
            data: [new Mock("list-files-3-"), new Mock("list-files-4-")]
        });

        const file3Id = identityBHandlerCreateFilesResponse.data.files.createFiles.data[0].id;
        const file4Id = identityBHandlerCreateFilesResponse.data.files.createFiles.data[1].id;

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "files.file", rwd: "wd" }], identityA],
            [[{ name: "files.file", rwd: "d" }], identityA],
            [[{ name: "files.file", rwd: "w" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "files.file" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { listFiles } = useGqlHandler({ permissions, identity });
            let [response] = await listFiles();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("listFiles"));
        }

        const sufficientPermissionsAll = [
            [[{ name: "content.i18n" }, { name: "files.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.*" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            let [permissions, identity] = sufficientPermissionsAll[i];
            const { listFiles } = useGqlHandler({ permissions, identity });
            let [response] = await listFiles();
            expect(response).toEqual({
                data: {
                    files: {
                        listFiles: {
                            data: [
                                {
                                    id: file1Id,
                                    key: "list-files-1-key",
                                    type: "list-files-1-type",
                                    size: 4096,
                                    name: "list-files-1-name",
                                    tags: ["list-files-1-tag"]
                                },
                                {
                                    id: file2Id,
                                    key: "list-files-2-key",
                                    type: "list-files-2-type",
                                    size: 4096,
                                    name: "list-files-2-name",
                                    tags: ["list-files-2-tag"]
                                },
                                {
                                    id: file3Id,
                                    key: "list-files-3-key",
                                    type: "list-files-3-type",
                                    size: 4096,
                                    name: "list-files-3-name",
                                    tags: ["list-files-3-tag"]
                                },
                                {
                                    id: file4Id,
                                    key: "list-files-4-key",
                                    type: "list-files-4-type",
                                    size: 4096,
                                    name: "list-files-4-name",
                                    tags: ["list-files-4-tag"]
                                }
                            ],
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "files.file", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listFiles();
        expect(response).toEqual({
            data: {
                files: {
                    listFiles: {
                        data: [
                            {
                                id: file1Id,
                                key: "list-files-1-key",
                                type: "list-files-1-type",
                                size: 4096,
                                name: "list-files-1-name",
                                tags: ["list-files-1-tag"]
                            },
                            {
                                id: file2Id,
                                key: "list-files-2-key",
                                type: "list-files-2-type",
                                size: 4096,
                                name: "list-files-2-name",
                                tags: ["list-files-2-tag"]
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "files.file", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listFiles();
        expect(response).toEqual({
            data: {
                files: {
                    listFiles: {
                        data: [
                            {
                                id: file3Id,
                                key: "list-files-3-key",
                                type: "list-files-3-type",
                                size: 4096,
                                name: "list-files-3-name",
                                tags: ["list-files-3-tag"]
                            },
                            {
                                id: file4Id,
                                key: "list-files-4-key",
                                type: "list-files-4-type",
                                size: 4096,
                                name: "list-files-4-name",
                                tags: ["list-files-4-tag"]
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow "createFile" if identity has sufficient permissions`, async () => {
        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "files.file", own: false, rwd: "r" }], identityA],
            [[{ name: "files.file", own: false, rwd: "rd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "files.file" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { createFile } = useGqlHandler({ permissions, identity });

            let [response] = await createFile({ data: new Mock() });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("createFile"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "files.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            let [permissions, identity] = sufficientPermissions[i];
            const { createFile } = useGqlHandler({ permissions, identity });

            const data = new Mock(`file-create-${i}-`);
            let [response] = await createFile({ data });
            expect(response).toEqual({
                data: {
                    files: {
                        createFile: {
                            data: { ...data, id: response.data.files.createFile.data.id },
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "updateFile" if identity has sufficient permissions`, async () => {
        const { createFile } = defaultHandler;
        const mock = new Mock("update-file-");

        const [createFileResponse] = await createFile({ data: mock });
        const fileId = createFileResponse.data.files.createFile.data.id;

        let insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "files.file", rwd: "r" }], identityA],
            [[{ name: "files.file", rwd: "rd" }], identityA],
            [[{ name: "files.file", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "files.file" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { updateFile } = useGqlHandler({ permissions, identity });
            let [response] = await updateFile({ id: fileId, data: mock });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateFile"));
        }

        let sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "files.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            let [permissions, identity] = sufficientPermissions[i];
            const { updateFile } = useGqlHandler({ permissions, identity });
            let [response] = await updateFile({ id: fileId, data: mock });
            expect(response).toEqual({
                data: {
                    files: {
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
        const { createFile } = defaultHandler;
        const mock = new Mock("get-file-");

        const [createFileResponse] = await createFile({ data: mock });
        console.log(JSON.stringify(createFileResponse, null, 2));
        const fileId = createFileResponse.data.files.createFile.data.id;

        let insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "files.file", rwd: "w" }], identityA],
            [[{ name: "files.file", rwd: "wd" }], identityA],
            [[{ name: "files.file", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "files.file" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { getFile } = useGqlHandler({ permissions, identity });
            let [response] = await getFile({ id: fileId });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("getFile"));
        }

        let sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "files.file" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "files.file", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            let [permissions, identity] = sufficientPermissions[i];
            const { getFile } = useGqlHandler({ permissions, identity });
            let [response] = await getFile({ id: fileId });
            expect(response).toEqual({
                data: {
                    files: {
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
