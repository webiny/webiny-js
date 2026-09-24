import { describe, expect, it } from "vitest";
import { useHandler } from "./helpers/useHandler";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";

const isSql = process.env.WEBINY_STORAGE?.includes("sql");

describe.skipIf(isSql)("headless cms audit logs", () => {
    it("should store audit logs when an entry is created and updated", async () => {
        const { handler } = useHandler();
        const context = await handler();
        const { container } = context;

        const group = await container.resolve(CreateGroupUseCase).execute({
            name: "Group",
            slug: "group",
            icon: { type: "icon", name: "fas/star" },
            description: ""
        });
        expect(group.isOk()).toBe(true);

        const model = await container.resolve(CreateModelUseCase).execute({
            name: "Car",
            modelId: "car",
            singularApiName: "Car",
            pluralApiName: "Cars",
            group: group.value.id,
            titleFieldId: "title",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    type: "text",
                    label: "Title",
                    storageId: "text@title"
                }
            ],
            layout: [["title"]]
        } as any);
        expect(model.isOk()).toBe(true);

        const entry = await container.resolve(CreateEntryUseCase).execute(model.value, {
            values: { title: "First" }
        });
        expect(entry.isOk()).toBe(true);

        const updated = await container
            .resolve(UpdateEntryUseCase)
            .execute(model.value, entry.value.id, { values: { title: "Second" } } as any);
        expect(updated.isOk()).toBe(true);

        const logs = await context.auditLogs.listAuditLogs({
            app: "HEADLESS_CMS",
            entityId: entry.value.id,
            limit: 10
        } as any);

        expect(logs.error).toBeUndefined();
        expect(logs.items.map(log => `${log.entity}:${log.action}`).sort()).toEqual([
            "ENTRY:CREATE",
            "ENTRY_REVISION:UPDATE"
        ]);
    });
});
