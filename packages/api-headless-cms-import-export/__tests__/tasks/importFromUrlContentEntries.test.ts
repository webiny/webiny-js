import { createImportFromUrlContentEntriesTask } from "~/tasks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { CmsImportExportFileType, Context, ICmsImportExportValidatedFile } from "~/types";
import { useHandler } from "~tests/helpers/useHandler";
import { ResponseContinueResult, ResponseErrorResult, TaskResponseStatus } from "@webiny/tasks";
import { categoryModel } from "~tests/helpers/models";
import path from "path";

jest.mock("~/tasks/domain/downloadFileFromUrl/DownloadFileFromUrl", () => {
    return {
        DownloadFileFromUrl: {
            process: async () => {
                return "continue";
            }
        },
        createDownloadFileFromUrl: () => {
            return {
                process: async () => {
                    return "continue";
                },
                isDone: () => {
                    return false;
                },
                getNext: () => {
                    return 1;
                }
            };
        }
    };
});

describe("import from url content entries", () => {
    let context: Context;

    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket";
        const { createContext } = useHandler();
        context = await createContext();
    });

    it("should run the task and fail because of missing model", async () => {
        const definition = createImportFromUrlContentEntriesTask();

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {},
            name: "Import from URL Content Entries"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                code: "MISSING_MODEL_ID",
                message: `Missing "modelId" in the input.`,
                data: {
                    input: {}
                }
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and fail because of missing files", async () => {
        const definition = createImportFromUrlContentEntriesTask();

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId: categoryModel.modelId
            },
            name: "Import from URL Content Entries"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                code: "NO_FILE_FOUND",
                message: `No file found in the provided data.`,
                data: {
                    input: {
                        modelId: categoryModel.modelId
                    }
                }
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and fail because of non-existing model", async () => {
        const definition = createImportFromUrlContentEntriesTask();

        const modelId = "nonExistingModelId";

        const file: ICmsImportExportValidatedFile = {
            get: "https://some-url.com/file-1.we.zip",
            head: "https://some-url.com/file-1.we.zip",
            size: 1000,
            checksum: "checksum",
            error: undefined,
            type: CmsImportExportFileType.COMBINED_ENTRIES
        };

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId,
                file
            },
            name: "Import from URL Content Entries"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                code: "MODEL_NOT_FOUND",
                message: `Model "${modelId}" not found.`,
                data: {
                    input: {
                        modelId,
                        file
                    }
                }
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task, trigger child tasks and return a continue response", async () => {
        const definition = createImportFromUrlContentEntriesTask();

        const file: ICmsImportExportValidatedFile = {
            get: path.resolve(__dirname, `../../mocks/testing.we.zip`),
            size: 4642,
            head: "https://some-url.com/file-1.we.zip",
            checksum: "checksum",
            error: undefined,
            type: CmsImportExportFileType.COMBINED_ENTRIES
        };

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId: categoryModel.modelId,
                file
            },
            name: "Import from URL Content Entries"
        });

        const runner = createRunner({
            context,
            task: definition,
            getRemainingTimeInMills: () => 1000
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toBeInstanceOf(ResponseContinueResult);

        expect(result).toEqual({
            delay: -1,
            status: TaskResponseStatus.CONTINUE,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id,
            input: {
                modelId: categoryModel.modelId,
                file: {
                    checksum: file.checksum,
                    get: file.get,
                    head: file.head,
                    type: file.type,
                    size: file.size
                },
                download: {
                    next: 1,
                    done: false
                }
            },
            message: undefined,
            wait: undefined
        });
    });
});
