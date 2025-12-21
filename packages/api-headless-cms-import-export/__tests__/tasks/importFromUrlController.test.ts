import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import type { Context, ICmsImportExportValidatedFile } from "~/types";
import { CmsImportExportFileType } from "~/types";
import { useHandler } from "~tests/helpers/useHandler";
import { categoryModel } from "~tests/helpers/models";
import type { NonEmptyArray } from "@webiny/api/types";
import { IMPORT_FROM_URL_CONTROLLER_TASK } from "~/tasks/constants.js";

vi.setConfig({
    testTimeout: 60_000
});

function getTaskDefinition(context: Context) {
    const tasks = context.container.resolveAll(TaskDefinition);
    return tasks.find(task => task.id === IMPORT_FROM_URL_CONTROLLER_TASK)!;
}

describe("import from url controller", () => {
    let context: Context;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();
    });

    it("should run the task and fail because of missing model", async () => {
        const definition = getTaskDefinition(context);

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {},
            name: "Import from URL Controller"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result.status).toBe("error");
        expect(result).toEqual({
            error: {
                code: "MISSING_MODEL_ID",
                message: `Missing "modelId" in the input.`,
                data: {
                    input: {}
                }
            },
            status: TaskResultStatus.ERROR,
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and fail because of missing files", async () => {
        const definition = getTaskDefinition(context);

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId: categoryModel.modelId
            },
            name: "Import from URL Controller"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result.status).toBe("error");
        expect(result).toEqual({
            error: {
                code: "NO_FILES_FOUND",
                message: `No files found in the provided data.`,
                data: {
                    input: {
                        modelId: categoryModel.modelId
                    }
                }
            },
            status: TaskResultStatus.ERROR,
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and fail because of non-existing model", async () => {
        const definition = getTaskDefinition(context);

        const modelId = "nonExistingModelId";

        const files: NonEmptyArray<ICmsImportExportValidatedFile> = [
            {
                get: "https://some-url.com/file-1.we.zip",
                head: "https://some-url.com/file-1.we.zip",
                size: 1000,
                error: undefined,
                type: CmsImportExportFileType.ENTRIES,
                checksum: "checksum",
                checked: true,
                key: "file-1.we.zip"
            }
        ];

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId,
                files
            },
            name: "Import from URL Controller"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result.status).toBe("error");
        expect(result).toEqual({
            error: {
                code: "MODEL_NOT_FOUND",
                message: `Model "${modelId}" not found.`,
                data: {
                    input: {
                        modelId,
                        files
                    }
                }
            },
            status: TaskResultStatus.ERROR,
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task, trigger child tasks and return a continue response", async () => {
        expect.assertions(5);
        const definition = getTaskDefinition(context);

        const files: NonEmptyArray<ICmsImportExportValidatedFile> = [
            {
                get: "https://some-url.com/file-1.we.zip",
                head: "https://some-url.com/file-1.we.zip",
                size: 1000,
                error: undefined,
                type: CmsImportExportFileType.ENTRIES,
                checksum: "checksum",
                checked: true,
                key: "file-1.we.zip"
            },
            {
                get: "https://some-url.com/file-2.wa.zip",
                head: "https://some-url.com/file-2.wa.zip",
                size: 1250,
                error: undefined,
                type: CmsImportExportFileType.ASSETS,
                checksum: "checksum",
                checked: true,
                key: "file-2.wa.zip"
            }
        ];

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId: categoryModel.modelId,
                files
            },
            name: "Import from URL Controller"
        });

        console.warn = vi.fn();

        const runner = createRunner({
            context,
            task: definition,
            onContinue: async ({ taskId, result }) => {
                const children = await context.tasks.listTasks({
                    where: {
                        parentId: taskId
                    },
                    limit: 1000000
                });
                /**
                 * Don't update again if not required.
                 */
                if (children.items.every(child => child.taskStatus === TaskDataStatus.SUCCESS)) {
                    return;
                }
                for (const child of children.items) {
                    await context.tasks.updateTask(child.id, {
                        taskStatus: TaskDataStatus.SUCCESS
                    });
                }
                /**
                 * This is a strange expect, but we can do it as we know that it will happen due to the
                 * continue result on the first iteration of the runner.
                 */
                // assertion #1
                expect(result).toMatchObject({
                    status: TaskResultStatus.CONTINUE,
                    tenant: "root",
                    webinyTaskDefinitionId: definition.id,
                    webinyTaskId: task.id,
                    input: {
                        modelId: categoryModel.modelId,
                        files: files.map(file => {
                            const output = {
                                ...file
                            };
                            delete output.error;
                            return output;
                        }),
                        steps: {
                            download: {
                                triggered: true
                            }
                        }
                    },
                    message: undefined,
                    delay: -1
                });
            }
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root"
        });

        // assertion #2
        expect(result).toEqual({
            status: TaskResultStatus.DONE,
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id,
            output: {
                aborted: [],
                done: [],
                failed: [],
                invalid: [],
                files: ["cms-import/file-1.we.zip", "cms-import/file-2.wa.zip"]
            },
            message: undefined
        });

        // assertion #3
        expect(result.status).toBe("done");
    });
});
