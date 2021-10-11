import useHandler from "./useHandler";
import { PageImportExportTaskCrud, PageImportExportTaskStatus } from "~/types";

describe("Page builder import export task Test", () => {
    const { handler } = useHandler();

    test("Should able to create, update, list, get and delete page import export tasks", async () => {
        const { pageBuilder } = await handler();
        const pageImportExportTask: PageImportExportTaskCrud = pageBuilder.pageImportExportTask;

        // Create a PageImportExportTask
        let result = await pageImportExportTask.create({
            status: PageImportExportTaskStatus.PENDING
        });

        const taskId = result.id;

        expect(result).toMatchObject({
            status: "pending",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // Should be able to get task by id
        result = await pageImportExportTask.get(result.id);
        expect(result).toMatchObject({
            id: taskId,
            status: "pending",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // List all task
        let response = await pageImportExportTask.list({
            where: { tenant: result.tenant, locale: result.locale },
            limit: 10
        });
        expect(response).toMatchObject([
            {
                id: taskId,
                status: "pending",
                createdBy: {
                    id: "mocked",
                    displayName: "m"
                }
            }
        ]);

        // Update a PageImportExportTask
        result = await pageImportExportTask.update(result.id, {
            status: PageImportExportTaskStatus.PROCESSING
        });

        expect(result).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // Should be able to get updated task by id
        result = await pageImportExportTask.get(result.id);
        expect(result).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // List all task
        response = await pageImportExportTask.list();
        expect(response).toMatchObject([
            {
                id: taskId,
                status: "processing",
                createdBy: {
                    id: "mocked",
                    displayName: "m"
                }
            }
        ]);

        // Delete the task
        result = await pageImportExportTask.delete(result.id);
        expect(result).toMatchObject({
            id: taskId,
            status: "processing",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // Should list zero entry
        response = await pageImportExportTask.list();
        expect(response).toMatchObject([]);

        // Should get error when trying to get task by id
        result = await pageImportExportTask.get(result.id);
        expect(result).toBe(null);
    });

    test("Should able to create, update, list, get and delete page import export sub tasks", async () => {
        const { pageBuilder } = await handler();
        const pageImportExportTask: PageImportExportTaskCrud = pageBuilder.pageImportExportTask;

        // Create a PageImportExportTask
        let task = await pageImportExportTask.create({
            status: PageImportExportTaskStatus.PENDING
        });
        const taskId = task.id;

        expect(task).toMatchObject({
            status: "pending",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // Should be able to get task by id
        task = await pageImportExportTask.get(task.id);
        expect(task).toMatchObject({
            id: taskId,
            status: "pending",
            createdBy: {
                id: "mocked",
                displayName: "m"
            }
        });

        // Should be able to create a subTask
        let subTask = await pageImportExportTask.createSubTask(task.id, "0001", {
            status: PageImportExportTaskStatus.PENDING,
            input: { key: "xyz" }
        });
        expect(subTask).toMatchObject({
            status: PageImportExportTaskStatus.PENDING,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });

        // Should be able to get a subTask
        subTask = await pageImportExportTask.getSubTask(taskId, "0001");
        expect(subTask).toMatchObject({
            status: PageImportExportTaskStatus.PENDING,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });
        // list of the "pending" sub tasks should be 1
        let list = await pageImportExportTask.listSubTasks(
            taskId,
            PageImportExportTaskStatus.PENDING,
            10
        );
        expect(list.length).toBe(1);
        expect(list).toMatchObject([
            {
                status: PageImportExportTaskStatus.PENDING,
                input: { key: "xyz" },
                id: `0001`,
                parent: taskId
            }
        ]);

        // Should be able to update the sub task
        subTask = await pageImportExportTask.updateSubTask(task.id, "0001", {
            status: PageImportExportTaskStatus.COMPLETED,
            input: { key: "xyz" }
        });
        expect(subTask).toMatchObject({
            status: PageImportExportTaskStatus.COMPLETED,
            input: { key: "xyz" },
            id: `0001`,
            parent: taskId
        });

        // list of the "pending" sub tasks should be zero
        list = await pageImportExportTask.listSubTasks(
            taskId,
            PageImportExportTaskStatus.PENDING,
            10
        );
        expect(list.length).toBe(0);
        expect(list).toMatchObject([]);

        // list of the "completed" sub tasks should be 1
        list = await pageImportExportTask.listSubTasks(
            taskId,
            PageImportExportTaskStatus.COMPLETED,
            10
        );
        expect(list.length).toBe(1);
        expect(list).toMatchObject([
            {
                status: PageImportExportTaskStatus.COMPLETED,
                input: { key: "xyz" },
                id: `0001`,
                parent: taskId
            }
        ]);
    });
});
