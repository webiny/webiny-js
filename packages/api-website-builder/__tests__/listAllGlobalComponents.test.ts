import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { GlobalComponentModelProvider } from "~/domain/globals/abstractions.js";
import { GlobalComponentEntryId } from "~/domain/globals/GlobalComponentEntryId.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { ListAllGlobalComponentsUseCase as UseCaseAbstraction } from "~/features/globals/ListAllGlobalComponents/abstractions.js";
import { ListAllGlobalComponentsFeature } from "~/features/globals/ListAllGlobalComponents/feature.js";

const entry = (name: string, language: string, scope?: string, entryId?: string) => ({
    entryId:
        entryId ??
        GlobalComponentEntryId.from(name, GlobalComponentLanguage.from(language), scope).toString(),
    values: {
        name,
        language,
        ...(scope ? { scope } : {}),
        elements: {},
        bindings: {}
    }
});

// `entries` is one page of results, or several (`[[...], [...]]`), each page's cursor its index.
function createContainer(entries: any[], canRead = true) {
    const pages: any[][] = Array.isArray(entries[0]) ? entries : [entries];
    const wheres: unknown[] = [];
    const cursors: unknown[] = [];
    const container = new Container();
    container.registerInstance(WbPermissions, {
        canRead: async () => canRead
    } as any);
    container.registerInstance(GlobalComponentModelProvider, {
        get: async () => ({})
    } as any);
    container.registerInstance(ListLatestEntriesUseCase, {
        execute: async (_model: unknown, params: { where: unknown; after?: string | null }) => {
            wheres.push(params.where);
            cursors.push(params.after);
            const index = params.after ? Number(params.after) : 0;
            const hasMoreItems = index < pages.length - 1;
            return Result.ok({
                entries: pages[index],
                meta: { hasMoreItems, cursor: hasMoreItems ? String(index + 1) : null }
            });
        }
    } as any);
    ListAllGlobalComponentsFeature.register(container);
    return { useCase: container.resolve(UseCaseAbstraction), wheres, cursors };
}

describe("ListAllGlobalComponentsUseCase", () => {
    it("lists a scope's records in every language, leaving out strays and other scopes", async () => {
        const { useCase, wheres } = createContainer([
            entry("Pac/LoginDialog", "default", "t5t"),
            entry("Pac/LoginDialog", "de", "t5t"),
            entry("Pac/CheckoutDialog", "default", "t5t"),
            // A stray (not at its fixed id), and a record of another scope.
            entry("Pac/CheckoutDialog", "de", "t5t", "wbgc-stray"),
            entry("Pac/LoginDialog", "default", "other")
        ]);

        const result = await useCase.execute({ scope: "t5t" });

        expect(wheres).toEqual([{ values: { scope: "t5t" } }]);
        expect(result.value.map(item => `${item.name} ${item.language} ${item.scope}`)).toEqual([
            "Pac/LoginDialog default t5t",
            "Pac/LoginDialog de t5t",
            "Pac/CheckoutDialog default t5t"
        ]);
    });

    it("reads every page", async () => {
        const { useCase, cursors } = createContainer([
            [entry("Pac/LoginDialog", "default", "t5t")],
            [entry("Pac/LoginDialog", "de", "t5t")]
        ]);

        const result = await useCase.execute({ scope: "t5t" });

        expect(cursors).toEqual([null, "1"]);
        expect(result.value.map(item => `${item.name} ${item.language}`)).toEqual([
            "Pac/LoginDialog default",
            "Pac/LoginDialog de"
        ]);
    });

    it("lists the records without a scope when none is named", async () => {
        const { useCase, wheres } = createContainer([
            entry("Demo/Header", "default"),
            entry("Demo/Header", "en"),
            entry("Demo/Header", "default", "t5t")
        ]);

        const result = await useCase.execute();

        // The storage leaves out the scoped records; the repository still checks.
        expect(wheres).toEqual([{ values: { scope: null } }]);
        expect(result.value.map(item => `${item.name} ${item.language}`)).toEqual([
            "Demo/Header default",
            "Demo/Header en"
        ]);
    });

    it("refuses a reader without page access", async () => {
        const { useCase } = createContainer([], false);

        const result = await useCase.execute({ scope: "t5t" });

        expect(result.error).toBeInstanceOf(PageNotAuthorizedError);
    });
});
