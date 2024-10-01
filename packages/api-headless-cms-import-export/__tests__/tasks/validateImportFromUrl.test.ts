import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import { CmsImportExportFileType, Context, ICmsImportExportFile } from "~/types";
import { createValidateImportFromUrlTask } from "~/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";
import { IValidateImportFromUrlInput } from "~/tasks/domain/abstractions/ValidateImportFromUrl";
import { HeadObjectCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

jest.mock("~/tasks/utils/externalFileFetcher", () => {
    return {
        ExternalFileFetcher: function () {
            return {
                mocked: "yes",
                timeout: 100,
                async fetch(url: string) {
                    if (url.includes("error")) {
                        return {
                            error: {
                                code: "GET_FETCH_ERROR",
                                message: "Fetch error.",
                                data: {
                                    url
                                }
                            }
                        };
                    } else if (url.includes("missing")) {
                        return {
                            file: null,
                            error: null
                        };
                    }
                    return {
                        file: {
                            name: url.split("/").pop() as string,
                            size: 1234,
                            url,
                            contentType: "application/zip",
                            checksum: "checksum"
                        }
                    };
                },
                async head(url: string) {
                    if (url.includes("error")) {
                        return {
                            error: {
                                code: "HEAD_FETCH_ERROR",
                                message: "Fetch error.",
                                data: {
                                    url
                                }
                            }
                        };
                    } else if (url.includes("missing")) {
                        return {
                            file: null,
                            error: null
                        };
                    }
                    return {
                        file: {
                            name: url.split("/").pop() as string,
                            size: 1234,
                            url,
                            contentType: "application/zip",
                            checksum: "checksum"
                        }
                    };
                }
            };
        }
    };
});

describe("validate import from url task", () => {
    let context: Context;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();
    });

    it("should run the task and return a error response - no task with given id", async () => {
        const definition = createValidateImportFromUrlTask();

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: "unknownTaskId",
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toMatchObject({
            status: "error",
            error: {
                code: "TASK_NOT_FOUND",
                message: 'Task "unknownTaskId" cannot be executed because it does not exist.'
            },
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: "unknownTaskId"
        });
    });

    it("should run the task and return a error response - faulty input", async () => {
        const definition = createValidateImportFromUrlTask();

        const task = await context.tasks.createTask({
            name: 'Import Content Entries from URL Controller for "modelId"',
            definitionId: definition.id,
            input: {}
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toMatchObject({
            error: {
                code: "NO_FILES_FOUND",
                data: {
                    input: {}
                },
                message: "No files found."
            },
            status: "error",
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and return a error response - file validation failed", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(HeadObjectCommand).resolves({
            ETag: `"checksum"`
        });
        const definition = createValidateImportFromUrlTask();

        const files: NonEmptyArray<ICmsImportExportFile> = [
            {
                head: "https://example.com/file1.json",
                get: "https://example.com/file1.json",
                type: CmsImportExportFileType.ENTRIES,
                error: undefined,
                checksum: "checksum",
                key: "key-file1.json"
            },
            {
                head: "https://example.com/file2.wa.zip",
                get: "https://example.com/file2.wa.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined,
                checksum: "checksum",
                key: "key-file2.wa.zip"
            },
            {
                head: "https://example.com/file3-error.wa.zip",
                get: "https://example.com/file3-error.wa.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined,
                checksum: "checksum",
                key: "key-file3-error.wa.zip"
            },
            {
                head: "https://example.com/file4-missing.wa.zip",
                get: "https://example.com/file4-missing.wa.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined,
                checksum: "checksum",
                key: "key-file4-missing.wa.zip"
            }
        ];

        const task = await context.tasks.createTask({
            name: 'Import Content Entries from URL Controller for "modelId"',
            definitionId: definition.id,
            input: {
                files
            }
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual({
            status: "done",
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id,
            message: undefined,
            output: {
                modelId: undefined,
                error: {
                    code: "INVALID_FILES",
                    data: {
                        files: [
                            "key-file1.json",
                            "key-file3-error.wa.zip",
                            "key-file4-missing.wa.zip"
                        ]
                    },
                    message: "One or more files are invalid."
                },
                files: [
                    {
                        ...files[0],
                        checked: true,
                        error: {
                            data: {
                                pathname: "/file1.json",
                                type: "json"
                            },
                            code: "FILE_TYPE_NOT_SUPPORTED",
                            message: "File type not supported."
                        },
                        size: undefined,
                        type: undefined
                    },
                    {
                        ...files[1],
                        checked: true,
                        size: 1234
                    },
                    {
                        ...files[2],
                        checked: true,
                        error: {
                            code: "HEAD_FETCH_ERROR",
                            data: {
                                url: files[2].head
                            },
                            message: "Fetch error."
                        },
                        type: undefined,
                        size: undefined
                    },
                    {
                        ...files[3],
                        checked: true,
                        error: {
                            code: "FILE_NOT_FOUND",
                            data: {
                                url: files[3].head
                            },
                            message: "File not found."
                        },
                        type: undefined,
                        size: undefined
                    }
                ]
            }
        });
    });

    it("should properly validate all the files", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(HeadObjectCommand).resolves({});

        const definition = createValidateImportFromUrlTask();

        const files: NonEmptyArray<ICmsImportExportFile> = [
            {
                head: "https://example.com/file1.we.zip",
                get: "https://example.com/file1.we.zip",
                type: CmsImportExportFileType.ENTRIES,
                error: undefined,
                checksum: "checksum",
                key: "key-file1.we.zip"
            },
            {
                head: "https://example.com/file2.wa.zip",
                get: "https://example.com/file2.wa.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined,
                checksum: "checksum",
                key: "key-file2.wa.zip"
            }
        ];

        const task = await context.tasks.createTask<IValidateImportFromUrlInput>({
            name: 'Import Content Entries from URL Controller for "modelId"',
            definitionId: definition.id,
            input: {
                files,
                model: {
                    modelId: "modelId",
                    fields: []
                }
            }
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toMatchObject({
            locale: "en-US",
            message: undefined,
            output: {
                files: [
                    {
                        get: "https://example.com/file1.we.zip",
                        head: "https://example.com/file1.we.zip",
                        size: 1234,
                        type: CmsImportExportFileType.ENTRIES
                    },
                    {
                        get: "https://example.com/file2.wa.zip",
                        head: "https://example.com/file2.wa.zip",
                        size: 1234,
                        type: CmsImportExportFileType.ASSETS
                    }
                ]
            },
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });
});
