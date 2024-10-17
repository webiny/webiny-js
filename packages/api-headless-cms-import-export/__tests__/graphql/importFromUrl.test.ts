import { useHandler } from "~tests/helpers/useHandler";
import { createValidateImportFromUrlTask } from "~/tasks";
import { TaskDataStatus } from "@webiny/tasks";

describe("import from url - graphql", () => {
    it("should fail to import from URL because of invalid ID", async () => {
        const { importFromUrl } = useHandler();

        const [result] = await importFromUrl({
            id: "unknownId"
        });
        expect(result).toEqual({
            data: {
                importFromUrl: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        data: null,
                        message: `Import from URL task with id "unknownId" not found.`
                    }
                }
            }
        });
    });

    it("should fail to import from URL because of integrity check not done yet", async () => {
        const { importFromUrl, createContext } = useHandler();

        const context = await createContext();

        const definition = createValidateImportFromUrlTask();

        const task = await context.tasks.createTask({
            name: "Test Task",
            definitionId: definition.id,
            input: {
                files: [],
                model: {
                    modelId: "aModelId"
                }
            }
        });

        const [result] = await importFromUrl({
            id: task.id
        });
        expect(result).toEqual({
            data: {
                importFromUrl: {
                    data: null,
                    error: {
                        code: "INTEGRITY_CHECK_FAILED",
                        data: {
                            status: "pending"
                        },
                        message: "Integrity check failed."
                    }
                }
            }
        });
    });

    it("should fail to import from URL because of no files in the integrity check output", async () => {
        const { importFromUrl, createContext } = useHandler();

        const context = await createContext();

        const definition = createValidateImportFromUrlTask();

        const task = await context.tasks.createTask({
            name: "Test Task",
            definitionId: definition.id,
            input: {
                files: [],
                model: {
                    modelId: "aModelId"
                }
            }
        });

        await context.tasks.updateTask(task.id, {
            taskStatus: TaskDataStatus.SUCCESS
        });

        const [result] = await importFromUrl({
            id: task.id
        });
        expect(result).toEqual({
            data: {
                importFromUrl: {
                    data: null,
                    error: {
                        code: "NO_FILES_FOUND",
                        data: null,
                        message: "No files found in the provided data."
                    }
                }
            }
        });
    });

    it("should fail to import from URL because import was already started", async () => {
        const { importFromUrl, createContext } = useHandler();

        const context = await createContext();

        const definition = createValidateImportFromUrlTask();

        const task = await context.tasks.createTask({
            name: "Test Task",
            definitionId: definition.id,
            input: {
                files: [],
                model: {
                    modelId: "aModelId"
                }
            }
        });

        await context.tasks.updateTask(task.id, {
            taskStatus: TaskDataStatus.SUCCESS,
            output: {
                importTaskId: "notImportant",
                files: [
                    {
                        url: "somethingNotImportant"
                    }
                ]
            }
        });

        const [result] = await importFromUrl({
            id: task.id
        });
        expect(result).toEqual({
            data: {
                importFromUrl: {
                    data: null,
                    error: {
                        code: "IMPORT_TASK_EXISTS",
                        data: {
                            id: "notImportant"
                        },
                        message: "Import was already started. You cannot start it again."
                    }
                }
            }
        });
    });

    it("should properly trigger the import from URL task", async () => {
        const { importFromUrl, createContext } = useHandler();

        const context = await createContext();

        const definition = createValidateImportFromUrlTask();

        const task = await context.tasks.createTask({
            name: "Test Task",
            definitionId: definition.id,
            input: {
                files: [],
                model: {
                    modelId: "aModelId"
                }
            }
        });

        await context.tasks.updateTask(task.id, {
            taskStatus: TaskDataStatus.SUCCESS,
            output: {
                files: [
                    {
                        url: "somethingNotImportant"
                    }
                ]
            }
        });

        const [result] = await importFromUrl({
            id: task.id
        });

        expect(result).toEqual({
            data: {
                importFromUrl: {
                    data: {
                        id: expect.any(String),
                        status: "pending",
                        files: null
                    },
                    error: null
                }
            }
        });

        const parentTask = await context.tasks.getTask(task.id);

        expect(parentTask).toMatchObject({
            output: {
                importTaskId: result.data.importFromUrl.data.id
            }
        });
    });
});
