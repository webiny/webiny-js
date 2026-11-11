import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { CreateFlpUseCase } from "~/features/flp/CreateFlp/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { FolderAfterCreateEventHandler } from "~/features/folder/CreateFolder/abstractions.js";
import { CreateFlpOnFolderCreatedFeature } from "~/features/flp/CreateFlpOnFolderCreated/feature.js";
import { FolderAfterCreateEvent } from "~/features/folder/CreateFolder/events.js";

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
    const tasks = { trigger: vi.fn(async () => ({})) };
    container.registerInstance(CreateFlpUseCase, createFlpUseCase as any);
    container.registerInstance(TaskService, tasks as any);
    CreateFlpOnFolderCreatedFeature.register(container);
    const [handler] = container.resolveAll(FolderAfterCreateEventHandler);
    return { handler, createFlpUseCase, tasks };
};

describe("CreateFlpOnFolderCreated", () => {
    it("should create the FLP record in the same request, without a task", async () => {
        const { handler, createFlpUseCase, tasks } = setup(async () => {});

        await handler.handle(new FolderAfterCreateEvent({ folder } as any));

        expect(createFlpUseCase.execute).toHaveBeenCalledWith(folder);
        expect(tasks.trigger).not.toHaveBeenCalled();
    });

    it("should fall back to the task when the FLP record can't be created right away", async () => {
        const { handler, tasks } = setup(async () => {
            throw new Error("Parent FLP not found.");
        });

        await handler.handle(new FolderAfterCreateEvent({ folder } as any));

        expect(tasks.trigger).toHaveBeenCalledTimes(1);
    });
});
