import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsContext } from "~/types";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import {
    GetRevisionByIdStorageOperation,
    ListModelsStorageOperation,
    ListGroupsStorageOperation
} from "@webiny/api-headless-cms/features/shared/storageOperations/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Container } from "@webiny/di";

// @ts-expect-error This is enough for tests.
const productPlugin = createModelPlugin({
    noValidate: true,
    modelId: "product",
    singularApiName: "Product",
    pluralApiName: "Products",
    group: "ecommerce",
    name: "Product",
    description: "Product model",
    fields: [
        {
            id: "name",
            fieldId: "name",
            storageId: "text@name",
            type: "text",
            label: "Name",
            validation: [],
            listValidation: []
        }
    ],
    layout: [],
    titleFieldId: "name"
});

const getProductModel = async (container: Container): Promise<CmsModel> => {
    const identityCtx = container.resolve(IdentityContext);
    const result = await identityCtx.withoutAuthorization(() =>
        container.resolve(GetModelUseCase).execute("product")
    );
    return result.value as CmsModel;
};

/**
 * The context's tenant scope is "root": storage operations act on "root" only, and ignore any tenant
 * a caller passes.
 */
describe("storage operations take their tenant from the tenant scope", () => {
    const { handler } = useHandler<CmsContext>({
        plugins: [productPlugin]
    });

    const createContext = () => {
        return handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": "root" }
        });
    };

    it("lists models and groups of the scope's tenant", async () => {
        const { container } = await createContext();

        const models = await container
            .resolve(ListModelsStorageOperation)
            .execute({ where: { tenant: "root" } });
        expect(Array.isArray(models)).toBe(true);

        const groups = await container
            .resolve(ListGroupsStorageOperation)
            .execute({ where: { tenant: "root" } });
        expect(Array.isArray(groups)).toBe(true);
    });

    it("lists the scope's models and groups when given another tenant", async () => {
        const { container } = await createContext();

        const models = await container
            .resolve(ListModelsStorageOperation)
            .execute({ where: { tenant: "root" } });
        await expect(
            container.resolve(ListModelsStorageOperation).execute({ where: { tenant: "webiny" } })
        ).resolves.toEqual(models);

        const groups = await container
            .resolve(ListGroupsStorageOperation)
            .execute({ where: { tenant: "root" } });
        await expect(
            container.resolve(ListGroupsStorageOperation).execute({ where: { tenant: "webiny" } })
        ).resolves.toEqual(groups);
    });

    it("reads an entry with a model of the scope's tenant", async () => {
        const { container } = await createContext();
        const model = await getProductModel(container);
        expect(model.tenant).toBe("root");

        const created = await container
            .resolve(CreateEntryUseCase)
            .execute(model, { values: { name: "Scoped product" } });
        expect(created.isOk()).toBe(true);
        const entry = created.value;

        const revision = await container
            .resolve(GetRevisionByIdStorageOperation)
            .execute(model, { id: entry.id });

        expect(revision).toMatchObject({
            id: entry.id,
            tenant: "root"
        });
    });

    it("reads the scope's entries when given a model of another tenant", async () => {
        const { container } = await createContext();
        const model = await getProductModel(container);

        const created = await container
            .resolve(CreateEntryUseCase)
            .execute(model, { values: { name: "Scoped product" } });
        expect(created.isOk()).toBe(true);
        const entry = created.value;

        const otherTenantModel: CmsModel = { ...model, tenant: "webiny" };
        const revision = await container
            .resolve(GetRevisionByIdStorageOperation)
            .execute(otherTenantModel, { id: entry.id });

        expect(revision).toMatchObject({
            id: entry.id,
            tenant: "root"
        });
    });
});
