import { beforeEach, describe, expect, it } from "vitest";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js";
import { useHandler } from "./utils/useHandler.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { GetLanguageByCodeUseCase } from "~/api/features/GetLanguageByCode/index.js";
import { ListLanguagesUseCase } from "~/api/features/ListLanguages/index.js";

describe("Language Query Use Cases", () => {
    let context: ApiCoreContext;

    const createLanguage = async (values: {
        name: string;
        code: string;
        direction?: string;
        isDefault?: boolean;
        enabled?: boolean;
    }) => {
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);

        const modelResult = await getModel.execute(LANGUAGE_MODEL_ID);
        if (modelResult.isFail()) {
            throw modelResult.error;
        }

        const result = await createEntry.execute(modelResult.value, {
            values: {
                name: values.name,
                code: values.code,
                direction: values.direction ?? "ltr",
                isDefault: values.isDefault ?? false,
                enabled: values.enabled ?? true
            }
        });

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    };

    beforeEach(async () => {
        const handler = useHandler();
        context = await handler.handler();
    });

    describe("GetLanguageByCodeUseCase", () => {
        it("should return a language by its code", async () => {
            await createLanguage({ name: "German", code: "de" });

            const getLanguageByCode = context.container.resolve(GetLanguageByCodeUseCase);
            const result = await getLanguageByCode.execute("de");

            if (result.isFail()) {
                throw result.error;
            }

            expect(result.value).toMatchObject({
                name: "German",
                code: "de",
                direction: "ltr",
                isDefault: false,
                enabled: true
            });
        });

        it("should return a failure for a non-existent language code", async () => {
            const getLanguageByCode = context.container.resolve(GetLanguageByCodeUseCase);
            const result = await getLanguageByCode.execute("xx");

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Languages/NotFound");
            }
        });
    });

    describe("ListLanguagesUseCase", () => {
        it("should list all language entries", async () => {
            await createLanguage({ name: "English", code: "en", isDefault: true });
            await createLanguage({ name: "German", code: "de" });
            await createLanguage({ name: "French", code: "fr" });

            const listLanguages = context.container.resolve(ListLanguagesUseCase);
            const result = await listLanguages.execute();

            if (result.isFail()) {
                throw result.error;
            }

            expect(result.value).toHaveLength(3);
            expect(result.value).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ code: "en", isDefault: true }),
                    expect.objectContaining({ code: "de", isDefault: false }),
                    expect.objectContaining({ code: "fr", isDefault: false })
                ])
            );
        });

        it("should return an empty array when no languages exist", async () => {
            const listLanguages = context.container.resolve(ListLanguagesUseCase);
            const result = await listLanguages.execute();

            if (result.isFail()) {
                throw result.error;
            }

            expect(result.value).toHaveLength(0);
        });
    });
});
