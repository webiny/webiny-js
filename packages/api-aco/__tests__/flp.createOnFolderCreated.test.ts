import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { CreateFlpUseCase } from "~/features/flp/CreateFlp/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { NotifyRecordChangeUseCase } from "@webiny/api-core/features/websockets/index.js";
import { FolderCatalogSync } from "~/features/flp/FolderCatalogSync/abstractions.js";
import { TaskFolderCatalogSync } from "~/flpTaskCatalog/TaskFolderCatalogSync.js";
import { Result } from "@webiny/feature/api";

const folder = {
    id: "folder-1",
    type: "test-folders",
    slug: "folder-1",
    title: "Folder 1",
    parentId: null,
    permissions: [{ target: "admin:1", level: "owner" }]
} as any;

const setup = (createFlp: () => Promise<void>) => {
    const container = new Container();
    const createFlpUseCase = { execute: vi.fn(createFlp) };
    const tasks = { trigger: vi.fn(async () => Result.ok({} as any)) };
    const notifyRecordChange = { execute: vi.fn(async () => {}) };
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() };
    const identityContext = {
        getIdentity: () => ({ id: "1", isAnonymous: () => false })
    };
    container.registerInstance(CreateFlpUseCase, createFlpUseCase as any);
    container.registerInstance(TaskService, tasks as any);
    container.registerInstance(NotifyRecordChangeUseCase, notifyRecordChange as any);
    container.registerInstance(Logger, logger as any);
    container.registerInstance(IdentityContext, identityContext as any);
    container.register(TaskFolderCatalogSync);
    const sync = container.resolve(FolderCatalogSync);
    return { sync, createFlpUseCase, tasks, notifyRecordChange };
};

describe("FLP record on folder create", () => {
    it("should create the FLP record in the same request, without a task", async () => {
        const { sync, createFlpUseCase, tasks, notifyRecordChange } = setup(async () => {});

        await sync.folderCreated(folder);

        expect(createFlpUseCase.execute).toHaveBeenCalledWith(folder);
        expect(tasks.trigger).not.toHaveBeenCalled();
        expect(notifyRecordChange.execute).toHaveBeenCalledTimes(1);
    });

    it("should fall back to the task when the FLP record can't be created right away", async () => {
        const { sync, tasks } = setup(async () => {
            throw new Error("Parent FLP not found.");
        });

        await sync.folderCreated(folder);

        expect(tasks.trigger).toHaveBeenCalledTimes(1);
    });
});
