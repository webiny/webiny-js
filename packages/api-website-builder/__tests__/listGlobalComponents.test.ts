import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import {
    ListGlobalComponentsRepository,
    ListGlobalComponentsUseCase as UseCaseAbstraction
} from "~/features/globals/ListGlobalComponents/abstractions.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/ListGlobalComponents/ListGlobalComponentsUseCase.js";
import { GlobalComponentPersistenceError } from "~/domain/globals/errors.js";

describe("ListGlobalComponentsUseCase", () => {
    it("keeps the language's own globals when the default ones can't be listed", async () => {
        const own = [{ name: "Demo/Header", language: "de" }] as any[];
        const repository: ListGlobalComponentsRepository.Interface = {
            execute: async ({ language }) => {
                return language === "de"
                    ? Result.ok(own)
                    : Result.fail(new GlobalComponentPersistenceError(new Error("Timeout")));
            }
        };

        const container = new Container();
        container.registerInstance(WbPermissions, { canRead: async () => true } as any);
        container.registerInstance(ListGlobalComponentsRepository, repository);
        container.register(ListGlobalComponentsUseCase);

        const result = await container
            .resolve(UseCaseAbstraction)
            .execute({ language: "de", fallback: true });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(own);
    });

    it('fills missing globals from the site\'s default language, then from "default"', async () => {
        const records: Record<string, any[]> = {
            de: [{ name: "Demo/Header", language: "de" }],
            en: [
                { name: "Demo/Header", language: "en" },
                { name: "Demo/Footer", language: "en" }
            ],
            default: [
                { name: "Demo/Footer", language: "default" },
                { name: "Demo/Banner", language: "default" }
            ]
        };
        const repository: ListGlobalComponentsRepository.Interface = {
            execute: async ({ language }) => Result.ok(records[language] ?? [])
        };

        const container = new Container();
        container.registerInstance(WbPermissions, { canRead: async () => true } as any);
        container.registerInstance(ListGlobalComponentsRepository, repository);
        container.registerInstance(GetDefaultLanguageUseCase, {
            execute: async () => Result.ok({ code: "en" })
        } as any);
        container.register(ListGlobalComponentsUseCase);

        const result = await container
            .resolve(UseCaseAbstraction)
            .execute({ language: "de", fallback: true });

        expect(result.value).toEqual([
            { name: "Demo/Header", language: "de" },
            { name: "Demo/Footer", language: "en" },
            { name: "Demo/Banner", language: "default" }
        ]);
    });
});
