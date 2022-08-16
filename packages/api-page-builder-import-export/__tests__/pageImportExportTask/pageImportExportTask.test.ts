import useHandler from "./useHandler";
import {
    PageImportExportTask,
    PageImportExportTaskCrud,
    PageImportExportTaskStatus
} from "~/types";
import { initialStats } from "~/importPages/utils";
import { defaultIdentity } from "../tenancySecurity";

describe("Page builder import export task Test", () => {
    const { handler } = useHandler();

    test("Should able to create, update, list, get and delete page import export tasks", async () => {
        const { pageBuilder } = await handler({}, {} as any);
        const pageImportExportTask: PageImportExportTaskCrud = pageBuilder.pageImportExportTask;

        // Create a PageImportExportTask
        const result = await pageImportExportTask.createTask({
            status: PageImportExportTaskStatus.PENDING
        });

        const taskId = result.id;

        expect(result).toMatchObject({
            status: "pending",
            createdBy: defaultIdentity
        });

        // Should be able to get task by id
        const getResult = (await pageImportExportTask.getTask(result.id)) as PageImportExportTask;
        expect(getResult).toMatchObject({
            id: taskId,
            status: "pending",
            createdBy: defaultIdentity
        });

        // List all task
        const listAllTasksResponse = await pageImportExportTask.listTasks({
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

        // Update a PageImportExportTask
        const updateResult = await pageImportExportTask.updateTask(getResult.id, {
            status: PageImportExportTaskStatus.PROCESSING
        });

        expect(updateResult).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: defaultIdentity
        });

        // Should be able to get updated task by id
        const getAfterUpdateResult = (await pageImportExportTask.getTask(
            updateResult.id
        )) as PageImportExportTask;
        expect(getAfterUpdateResult).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: defaultIdentity
        });

        // List all task
        const listAllTasksAfterUpdate = await pageImportExportTask.listTasks();
        expect(listAllTasksAfterUpdate).toMatchObject([
            {
                id: taskId,
                status: "processing",
                createdBy: defaultIdentity
            }
        ]);

        // Delete the task
        const deleteResult = await pageImportExportTask.deleteTask(getAfterUpdateResult.id);
        expect(deleteResult).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: defaultIdentity
        });

        // Should list zero entry
        const response = await pageImportExportTask.listTasks();
        expect(response).toMatchObject([]);

        // Should get error when trying to get task by id
        const resultWithError = await pageImportExportTask.getTask(deleteResult.id);
        expect(resultWithError).toBe(null);
    });

    test("Should able to create, update, list, get and delete page import export sub tasks", async () => {
        const { pageBuilder } = await handler({}, {} as any);
        const pageImportExportTask: PageImportExportTaskCrud = pageBuilder.pageImportExportTask;

        // Create a PageImportExportTask
        const task = await pageImportExportTask.createTask({
            status: PageImportExportTaskStatus.PENDING
        });
        const taskId = task.id;

        expect(task).toMatchObject({
            status: "pending",
            createdBy: defaultIdentity
        });

        // Should be able to get task by id
        const getTaskResponse = (await pageImportExportTask.getTask(
            task.id
        )) as PageImportExportTask;
        expect(getTaskResponse).toMatchObject({
            id: taskId,
            status: "pending",
            createdBy: defaultIdentity
        });

        // Should be able to create a subTask
        const createSubTaskResponse = await pageImportExportTask.createSubTask(
            getTaskResponse.id,
            "0001",
            {
                status: PageImportExportTaskStatus.PENDING,
                input: { key: "xyz" }
            }
        );
        expect(createSubTaskResponse).toMatchObject({
            status: PageImportExportTaskStatus.PENDING,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });

        // Should be able to get a subTask
        const getSubTaskResponse = await pageImportExportTask.getSubTask(taskId, "0001");
        expect(getSubTaskResponse).toMatchObject({
            status: PageImportExportTaskStatus.PENDING,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });
        // list of the "pending" sub tasks should be 1
        const listSubtasksPendingResponse = await pageImportExportTask.listSubTasks(
            taskId,
            PageImportExportTaskStatus.PENDING,
            10
        );
        expect(listSubtasksPendingResponse.length).toBe(1);
        expect(listSubtasksPendingResponse).toMatchObject([
            {
                status: PageImportExportTaskStatus.PENDING,
                input: { key: "xyz" },
                id: `0001`,
                parent: taskId
            }
        ]);

        // Should be able to update the sub task
        const getUpdatedSubTaskResponse = await pageImportExportTask.updateSubTask(
            task.id,
            "0001",
            {
                status: PageImportExportTaskStatus.COMPLETED,
                input: { key: "xyz" }
            }
        );
        expect(getUpdatedSubTaskResponse).toMatchObject({
            status: PageImportExportTaskStatus.COMPLETED,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });

        // list of the "pending" sub tasks should be zero
        const listPendingTasksZeroResponse = await pageImportExportTask.listSubTasks(
            taskId,
            PageImportExportTaskStatus.PENDING,
            10
        );
        expect(listPendingTasksZeroResponse.length).toBe(0);
        expect(listPendingTasksZeroResponse).toMatchObject([]);

        // list of the "completed" sub tasks should be 1
        const listCompletedSubTasks = await pageImportExportTask.listSubTasks(
            taskId,
            PageImportExportTaskStatus.COMPLETED,
            10
        );
        expect(listCompletedSubTasks.length).toBe(1);
        expect(listCompletedSubTasks).toMatchObject([
            {
                status: PageImportExportTaskStatus.COMPLETED,
                input: { key: "xyz" },
                id: `0001`,
                parent: taskId
            }
        ]);
    });

    test("Should able to update stats of a task", async () => {
        const { pageBuilder } = await handler({}, {} as any);
        const pageImportExportTask: PageImportExportTaskCrud = pageBuilder.pageImportExportTask;

        // Create a PageImportExportTask
        const result = await pageImportExportTask.createTask({
            status: PageImportExportTaskStatus.PENDING,
            stats: initialStats(5)
        });

        const taskId = result.id;

        expect(result).toMatchObject({
            status: "pending",
            createdBy: defaultIdentity,
            stats: {
                [PageImportExportTaskStatus.PENDING]: 5,
                [PageImportExportTaskStatus.PROCESSING]: 0,
                [PageImportExportTaskStatus.COMPLETED]: 0,
                [PageImportExportTaskStatus.FAILED]: 0,
                total: 5
            }
        });
        // Update status of one sub task from "pending" to "processing"
        await pageImportExportTask.updateStats(taskId, {
            prevStatus: PageImportExportTaskStatus.PENDING,
            nextStatus: PageImportExportTaskStatus.PROCESSING
        });

        // Should have 4 "pending" and 1 "processing"
        const result41 = await pageImportExportTask.getTask(taskId);
        expect(result41).toMatchObject({
            createdBy: defaultIdentity,
            stats: {
                [PageImportExportTaskStatus.PENDING]: 4,
                [PageImportExportTaskStatus.PROCESSING]: 1,
                [PageImportExportTaskStatus.COMPLETED]: 0,
                [PageImportExportTaskStatus.FAILED]: 0,
                total: 5
            }
        });

        // Update status of one sub task from "pending" to "failed"
        await pageImportExportTask.updateStats(taskId, {
            nextStatus: PageImportExportTaskStatus.FAILED,
            prevStatus: PageImportExportTaskStatus.PENDING
        });

        // Should have 3 "pending", 1 "failed", and 1 "processing"
        const result311 = await pageImportExportTask.getTask(taskId);
        expect(result311).toMatchObject({
            createdBy: defaultIdentity,
            stats: {
                [PageImportExportTaskStatus.PENDING]: 3,
                [PageImportExportTaskStatus.PROCESSING]: 1,
                [PageImportExportTaskStatus.COMPLETED]: 0,
                [PageImportExportTaskStatus.FAILED]: 1,
                total: 5
            }
        });
    });
});
