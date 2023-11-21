import useHandler from "./useHandler";
import { ImportExportTask, ImportExportTaskCrud, ImportExportTaskStatus } from "~/types";
import { initialStats } from "~/import/utils";
import { defaultIdentity } from "../tenancySecurity";
import { LambdaContext } from "@webiny/handler-aws/types";

describe("Page builder import export task Test", () => {
    const { handler } = useHandler();

    test("Should able to create, update, list, get and delete import export tasks", async () => {
        const { pageBuilder } = await handler({}, {} as LambdaContext);
        const importExportTask: ImportExportTaskCrud = pageBuilder.importExportTask;

        // Create a ImportExportTask
        const result = await importExportTask.createTask({
            status: ImportExportTaskStatus.PENDING
        });

        const taskId = result.id;

        expect(result).toMatchObject({
            status: "pending",
            createdBy: defaultIdentity
        });

        // Should be able to get task by id
        const getResult = (await importExportTask.getTask(result.id)) as ImportExportTask;
        expect(getResult).toMatchObject({
            id: taskId,
            status: "pending",
            createdBy: defaultIdentity
        });

        // List all task
        const listAllTasksResponse = await importExportTask.listTasks({
            where: { tenant: getResult.tenant, locale: getResult.locale },
            limit: 10
        });
        expect(listAllTasksResponse).toMatchObject([
            {
                id: taskId,
                status: "pending",
                createdBy: defaultIdentity
            }
        ]);

        // Update a ImportExportTask
        const updateResult = await importExportTask.updateTask(getResult.id, {
            status: ImportExportTaskStatus.PROCESSING
        });

        expect(updateResult).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: defaultIdentity
        });

        // Should be able to get updated task by id
        const getAfterUpdateResult = (await importExportTask.getTask(
            updateResult.id
        )) as ImportExportTask;
        expect(getAfterUpdateResult).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: defaultIdentity
        });

        // List all task
        const listAllTasksAfterUpdate = await importExportTask.listTasks();
        expect(listAllTasksAfterUpdate).toMatchObject([
            {
                id: taskId,
                status: "processing",
                createdBy: defaultIdentity
            }
        ]);

        // Delete the task
        const deleteResult = await importExportTask.deleteTask(getAfterUpdateResult.id);
        expect(deleteResult).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: defaultIdentity
        });

        // Should list zero entry
        const response = await importExportTask.listTasks();
        expect(response).toMatchObject([]);

        // Should get error when trying to get task by id
        const resultWithError = await importExportTask.getTask(deleteResult.id);
        expect(resultWithError).toBe(null);
    });

    test("Should able to create, update, list, get and delete import export sub tasks", async () => {
        const { pageBuilder } = await handler({}, {} as LambdaContext);
        const importExportTask: ImportExportTaskCrud = pageBuilder.importExportTask;

        // Create a ImportExportTask
        const task = await importExportTask.createTask({
            status: ImportExportTaskStatus.PENDING
        });
        const taskId = task.id;

        expect(task).toMatchObject({
            status: "pending",
            createdBy: defaultIdentity
        });

        // Should be able to get task by id
        const getTaskResponse = (await importExportTask.getTask(task.id)) as ImportExportTask;
        expect(getTaskResponse).toMatchObject({
            id: taskId,
            status: "pending",
            createdBy: defaultIdentity
        });

        // Should be able to create a subTask
        const createSubTaskResponse = await importExportTask.createSubTask(
            getTaskResponse.id,
            "0001",
            {
                status: ImportExportTaskStatus.PENDING,
                input: { key: "xyz" }
            }
        );
        expect(createSubTaskResponse).toMatchObject({
            status: ImportExportTaskStatus.PENDING,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });

        // Should be able to get a subTask
        const getSubTaskResponse = await importExportTask.getSubTask(taskId, "0001");
        expect(getSubTaskResponse).toMatchObject({
            status: ImportExportTaskStatus.PENDING,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });
        // list of the "pending" sub tasks should be 1
        const listSubtasksPendingResponse = await importExportTask.listSubTasks(
            taskId,
            ImportExportTaskStatus.PENDING,
            10
        );
        expect(listSubtasksPendingResponse.length).toBe(1);
        expect(listSubtasksPendingResponse).toMatchObject([
            {
                status: ImportExportTaskStatus.PENDING,
                input: { key: "xyz" },
                id: `0001`,
                parent: taskId
            }
        ]);

        // Should be able to update the sub task
        const getUpdatedSubTaskResponse = await importExportTask.updateSubTask(task.id, "0001", {
            status: ImportExportTaskStatus.COMPLETED,
            input: { key: "xyz" }
        });
        expect(getUpdatedSubTaskResponse).toMatchObject({
            status: ImportExportTaskStatus.COMPLETED,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });

        // list of the "pending" sub tasks should be zero
        const listPendingTasksZeroResponse = await importExportTask.listSubTasks(
            taskId,
            ImportExportTaskStatus.PENDING,
            10
        );
        expect(listPendingTasksZeroResponse.length).toBe(0);
        expect(listPendingTasksZeroResponse).toMatchObject([]);

        // list of the "completed" sub tasks should be 1
        const listCompletedSubTasks = await importExportTask.listSubTasks(
            taskId,
            ImportExportTaskStatus.COMPLETED,
            10
        );
        expect(listCompletedSubTasks.length).toBe(1);
        expect(listCompletedSubTasks).toMatchObject([
            {
                status: ImportExportTaskStatus.COMPLETED,
                input: { key: "xyz" },
                id: `0001`,
                parent: taskId
            }
        ]);
    });

    test("Should able to update stats of a task", async () => {
        const { pageBuilder } = await handler({}, {} as LambdaContext);
        const importExportTask: ImportExportTaskCrud = pageBuilder.importExportTask;

        // Create a ImportExportTask
        const result = await importExportTask.createTask({
            status: ImportExportTaskStatus.PENDING,
            stats: initialStats(5)
        });

        const taskId = result.id;

        expect(result).toMatchObject({
            status: "pending",
            createdBy: defaultIdentity,
            stats: {
                [ImportExportTaskStatus.PENDING]: 5,
                [ImportExportTaskStatus.PROCESSING]: 0,
                [ImportExportTaskStatus.COMPLETED]: 0,
                [ImportExportTaskStatus.FAILED]: 0,
                total: 5
            }
        });
        // Update status of one sub task from "pending" to "processing"
        await importExportTask.updateStats(taskId, {
            prevStatus: ImportExportTaskStatus.PENDING,
            nextStatus: ImportExportTaskStatus.PROCESSING
        });

        // Should have 4 "pending" and 1 "processing"
        const result41 = await importExportTask.getTask(taskId);
        expect(result41).toMatchObject({
            createdBy: defaultIdentity,
            stats: {
                [ImportExportTaskStatus.PENDING]: 4,
                [ImportExportTaskStatus.PROCESSING]: 1,
                [ImportExportTaskStatus.COMPLETED]: 0,
                [ImportExportTaskStatus.FAILED]: 0,
                total: 5
            }
        });

        // Update status of one sub task from "pending" to "failed"
        await importExportTask.updateStats(taskId, {
            nextStatus: ImportExportTaskStatus.FAILED,
            prevStatus: ImportExportTaskStatus.PENDING
        });

        // Should have 3 "pending", 1 "failed", and 1 "processing"
        const result311 = await importExportTask.getTask(taskId);
        expect(result311).toMatchObject({
            createdBy: defaultIdentity,
            stats: {
                [ImportExportTaskStatus.PENDING]: 3,
                [ImportExportTaskStatus.PROCESSING]: 1,
                [ImportExportTaskStatus.COMPLETED]: 0,
                [ImportExportTaskStatus.FAILED]: 1,
                total: 5
            }
        });
    });
});
