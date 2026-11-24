import { describe, expect, it } from "vitest";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.js";
import { useHandler } from "./utils/useHandler.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { ListLanguagesUseCase } from "~/api/features/ListLanguages/index.js";

/**
 * Full access to Headless CMS content, without the Languages permission.
 */
const cmsPermissions: SecurityPermission[] = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", own: false, rwd: "r" },
    { name: "cms.contentModel", own: false, rwd: "r" },
    { name: "cms.contentEntry", own: false, rwd: "rwd", pw: "rcpu" }
];

const createContext = async (permissions?: SecurityPermission[]): Promise<ApiCoreContext> => {
    return useHandler({ permissions }).handler();
};

const getModel = async (context: ApiCoreContext) => {
    const result = await context.container.resolve(GetModelUseCase).execute(LANGUAGE_MODEL_ID);
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

const createLanguage = async (context: ApiCoreContext, code: string) => {
    return context.container.resolve(CreateEntryUseCase).execute(await getModel(context), {
        values: {
            name: `Language ${code}`,
            code,
            direction: "ltr",
            isDefault: false,
            enabled: true
        }
    });
};

const listCodes = async (context: ApiCoreContext) => {
    const result = await context.container.resolve(ListLanguagesUseCase).execute();
    if (result.isFail()) {
        throw result.error;
    }
    return result.value.map(language => language.code);
};

describe("Language permissions", () => {
    it.each([
        ["Headless CMS content permissions only", cmsPermissions],
        ["read-only Languages permission", [{ name: "languages.*", rwd: "r" }]]
    ])("should allow reading but not changing languages with %s", async (_, permissions) => {
        const admin = await createContext();
        const created = await createLanguage(admin, "de");
        expect(created.isOk()).toBe(true);
        const language = created.value;

        const context = await createContext(permissions);
        const model = await getModel(context);

        expect(await listCodes(context)).toEqual(["de"]);

        const createResult = await createLanguage(context, "fr");
        expect(createResult.isFail()).toBe(true);
        expect(createResult.error.code).toBe("Cms/Entry/NotAuthorized");

        const updateResult = await context.container
            .resolve(UpdateEntryUseCase)
            .execute(model, language.id, { values: { name: "Changed" } });
        expect(updateResult.isFail()).toBe(true);
        expect(updateResult.error.code).toBe("Cms/Entry/NotAuthorized");

        const deleteResult = await context.container
            .resolve(DeleteEntryUseCase)
            .execute(model, language.entryId, { permanently: true });
        expect(deleteResult.isFail()).toBe(true);
        expect(deleteResult.error.code).toBe("Cms/Entry/NotAuthorized");

        // Nothing was changed.
        const languages = await admin.container.resolve(ListLanguagesUseCase).execute();
        expect(languages.value).toMatchObject([{ code: "de", name: "Language de" }]);
    });

    it("should allow changing languages with the Languages permission", async () => {
        const context = await createContext([{ name: "languages.*" }]);
        const model = await getModel(context);

        const created = await createLanguage(context, "de");
        expect(created.isOk()).toBe(true);

        const updateResult = await context.container
            .resolve(UpdateEntryUseCase)
            .execute(model, created.value.id, { values: { name: "German" } });
        expect(updateResult.isOk()).toBe(true);

        const deleteResult = await context.container
            .resolve(DeleteEntryUseCase)
            .execute(model, created.value.entryId, { permanently: true });
        expect(deleteResult.isOk()).toBe(true);

        expect(await listCodes(context)).toEqual([]);
    });
});
