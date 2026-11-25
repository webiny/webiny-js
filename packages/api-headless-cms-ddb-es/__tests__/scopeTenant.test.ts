import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsContext } from "~/types";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import {
    GetModelStorageOperation,
    GetRevisionByIdStorageOperation,
    ListModelsStorageOperation,
    ListGroupsStorageOperation,
    ListEntriesStorageOperation
} from "@webiny/api-headless-cms/features/shared/storageOperations/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantScopeMismatchError } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
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
 * The context's tenant scope is "root": storage operations act on "root" only, and throw when a
 * caller passes another tenant.
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

    it("throws when a model or group operation is given another tenant", async () => {
        const { container } = await createContext();

        await expect(
            container.resolve(ListModelsStorageOperation).execute({ where: { tenant: "webiny" } })
        ).rejects.toBeInstanceOf(TenantScopeMismatchError);

        await expect(
            container.resolve(ListGroupsStorageOperation).execute({ where: { tenant: "webiny" } })
        ).rejects.toBeInstanceOf(TenantScopeMismatchError);

        await expect(
            container
                .resolve(GetModelStorageOperation)
                .execute({ tenant: "webiny", modelId: "product" })
        ).rejects.toBeInstanceOf(TenantScopeMismatchError);
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

    it("throws when an entry operation is given a model of another tenant", async () => {
        const { container } = await createContext();
        const model = await getProductModel(container);
        const otherTenantModel: CmsModel = { ...model, tenant: "webiny" };

        await expect(
            container
                .resolve(GetRevisionByIdStorageOperation)
                .execute(otherTenantModel, { id: "anything#0001" })
        ).rejects.toBeInstanceOf(TenantScopeMismatchError);

        await expect(
            container
                .resolve(ListEntriesStorageOperation)
                .execute(otherTenantModel, { where: {}, limit: 10 })
        ).rejects.toBeInstanceOf(TenantScopeMismatchError);
    });
});
