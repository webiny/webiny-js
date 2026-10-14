import { describe, expect, it } from "vitest";
import { useHandler } from "./helpers/useHandler";
import { CreateFolderUseCase } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { DeleteFolderUseCase } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";

describe("folder audit logs", () => {
    it.each([
        ["wb:page", "PAGE_FOLDER"],
        ["wb:redirect", "REDIRECT_FOLDER"]
    ])(
        "should store an audit log when a %s folder is deleted",
        async (folderType, expectedEntity) => {
            const { handler } = useHandler();
            const context = await handler();
            const { container } = context;

            const folder = await container.resolve(CreateFolderUseCase).execute({
                title: "Folder",
                slug: "folder",
                type: folderType,
                parentId: null
            });
            expect(folder.isOk()).toBe(true);

            const deleted = await container.resolve(DeleteFolderUseCase).execute(folder.value.id);
            expect(deleted.isOk()).toBe(true);

            const logs = await context.listAuditLogs({
                app: "WEBSITE_BUILDER",
                entityId: folder.value.id,
                limit: 10
            } as any);

            expect(logs.error).toBeUndefined();
            expect(logs.items.map(log => `${log.entity}:${log.action}`)).toEqual([
                `${expectedEntity}:DELETE`
            ]);
        }
    );
});
