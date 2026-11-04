import type { Container } from "@webiny/di";
import { describe, expect, it } from "vitest";
import { ActionType } from "@webiny/common-audit-logs";
import { SaveGlobalComponentUseCase } from "@webiny/api-website-builder/features/globals/SaveGlobalComponent/index.js";
import { WebsiteBuilderFeature } from "@webiny/api-website-builder";
import { useHandler } from "./helpers/useHandler";

const setup = (container: Container) => WebsiteBuilderFeature.register(container);

const isSql = process.env.WEBINY_STORAGE?.includes("sql");

const createGlobal = (title: string, language: string | null) => {
    const id = "$global:Demo/Header";
    return {
        name: "Demo/Header",
        language,
        elements: { [id]: { type: "Webiny/Element", id, component: { name: "Demo/Header" } } },
        bindings: { [id]: { inputs: { title: { id: "b1", type: "text", static: title } } } }
    };
};

describe.skipIf(isSql)("global component audit logs", () => {
    it("audits the first save of a global as created, and later saves as updated", async () => {
        const { handler } = useHandler({ setup });
        const context = await handler();
        const saveGlobalComponent = context.container.resolve(SaveGlobalComponentUseCase);

        const created = await saveGlobalComponent.execute(createGlobal("Welcome", "de"));
        expect(created.isOk()).toBe(true);
        const updated = await saveGlobalComponent.execute(createGlobal("Willkommen", "de"));
        expect(updated.isOk()).toBe(true);

        const result = await context.listAuditLogs({
            app: "WEBSITE_BUILDER",
            entityId: "Demo/Header:de",
            sort: "ASC"
        });
        expect(result.error).toBeFalsy();

        const logs = result.items ?? [];
        expect(logs.map(log => [log.entity, log.action, log.message])).toEqual([
            ["GLOBAL_COMPONENT", ActionType.CREATE, "Global Component Created"],
            ["GLOBAL_COMPONENT", ActionType.UPDATE, "Global Component Updated"]
        ]);

        const content = JSON.parse(logs[1].content);
        const binding = (global: any) => global.bindings["$global:Demo/Header"].inputs.title.static;
        expect(binding(content.before)).toBe("Welcome");
        expect(binding(content.after)).toBe("Willkommen");
    });

    it("keeps a separate audit trail per language", async () => {
        const { handler } = useHandler({ setup });
        const context = await handler();
        const saveGlobalComponent = context.container.resolve(SaveGlobalComponentUseCase);

        await saveGlobalComponent.execute(createGlobal("Welcome", "en"));
        await saveGlobalComponent.execute(createGlobal("Plain", null));

        const english = await context.listAuditLogs({
            app: "WEBSITE_BUILDER",
            entityId: "Demo/Header:en"
        });
        expect(english.items?.map(log => log.action)).toEqual([ActionType.CREATE]);

        const plain = await context.listAuditLogs({
            app: "WEBSITE_BUILDER",
            entityId: "Demo/Header"
        });
        expect(plain.items?.map(log => log.action)).toEqual([ActionType.CREATE]);
    });
});
