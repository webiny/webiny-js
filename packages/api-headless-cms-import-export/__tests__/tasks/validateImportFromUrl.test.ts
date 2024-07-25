import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import { CmsImportExportFileType, Context, ICmsImportExportFile } from "~/types";
import { createValidateImportFromUrlTask } from "~/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";

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
                            contentType: "application/zip"
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
                            contentType: "application/zip"
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
            status: "error",
            error: {
                code: "NO_FILES_FOUND",
                data: {
                    input: {}
                },
                message: "No files found."
            },
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and return a error response - file validation failed", async () => {
        const definition = createValidateImportFromUrlTask();

        const files: NonEmptyArray<ICmsImportExportFile> = [
            {
                head: "https://example.com/file1.json",
                get: "https://example.com/file1.json",
                type: CmsImportExportFileType.COMBINED_ENTRIES,
                error: undefined
            },
            {
                head: "https://example.com/file2.wea.zip",
                get: "https://example.com/file2.wea.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined
            },
            {
                head: "https://example.com/file3-error.wea.zip",
                get: "https://example.com/file3-error.wea.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined
            },
            {
                head: "https://example.com/file4-missing.wea.zip",
                get: "https://example.com/file4-missing.wea.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined
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

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            status: "error",
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id,
            error: {
                code: "FILES_FAILED_VALIDATION",
                data: {
                    files: [
                        {
                            ...files[0],
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
                            ...files[2],
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
                    ],
                    input: {
                        files: files.map(file => {
                            delete file.error;
                            return {
                                ...file
                            };
                        })
                    }
                },
                message: "Some files failed validation."
            }
        });
    });

    it("should properly validate all the files", async () => {
        const definition = createValidateImportFromUrlTask();

        const files: NonEmptyArray<ICmsImportExportFile> = [
            {
                head: "https://example.com/file1.we.zip",
                get: "https://example.com/file1.we.zip",
                type: CmsImportExportFileType.COMBINED_ENTRIES,
                error: undefined
            },
            {
                head: "https://example.com/file2.wea.zip",
                get: "https://example.com/file2.wea.zip",
                type: CmsImportExportFileType.ASSETS,
                error: undefined
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
            locale: "en-US",
            message: undefined,
            output: {
                files: [
                    {
                        error: undefined,
                        get: "https://example.com/file1.we.zip",
                        head: "https://example.com/file1.we.zip",
                        size: 1234,
                        type: "combinedEntries"
                    },
                    {
                        error: undefined,
                        get: "https://example.com/file2.wea.zip",
                        head: "https://example.com/file2.wea.zip",
                        size: 1234,
                        type: "assets"
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
