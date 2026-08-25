import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "~/types";
import { useHandler } from "~tests/testHelpers/useHandler";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ModelFactory } from "~/features/modelBuilder/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ContextPlugin } from "@webiny/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

const TEST_MODEL_ID = "tenantIsolationTest";

class TestModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: TEST_MODEL_ID,
                    name: "Tenant Isolation Test"
                })
                .fields(fields => ({
                    title: fields.text().label("Title"),
                    value: fields.text().label("Value")
                }))
        ];
    }
}

const TestModel = ModelFactory.createImplementation({
    implementation: TestModelImpl,
    dependencies: []
});

describe("CMS Entry Tenant Isolation", () => {
    let context: CmsContext;

    beforeEach(async () => {
        const { handler } = useHandler({
            plugins: [
                createRegisterExtensionPlugin(ctx => {
                    ctx.container.register(TestModel);
                }),
                new ContextPlugin<ApiCoreContext>(async ctx => {
                    await ctx.tenancy.createTenant({
                        id: "sub-tenant",
                        name: "Sub Tenant",
                        parent: "root",
                        description: "Sub tenant for isolation test",
                        tags: []
                    });
                })
            ]
        });

        context = await handler({
            path: "/cms/manage",
            headers: {
                "x-tenant": "root",
                "x-webiny-cms-endpoint": "manage"
            }
        });
    });

    it("should isolate entries by model.tenant - entry created in root is not visible with a different model.tenant", async () => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const getEntryById = context.container.resolve(GetEntryByIdUseCase);

        const modelResult = await context.security.withoutAuthorization(() =>
            getModel.execute(TEST_MODEL_ID)
        );
        expect(modelResult.isOk()).toBe(true);

        const rootModel = modelResult.value;
        expect(rootModel.tenant).toBe("root");

        const createResult = await context.security.withoutAuthorization(() =>
            createEntry.execute(rootModel, {
                values: { title: "Root Entry", value: "root-value" }
            })
        );
        expect(createResult.isOk()).toBe(true);
        const entryId = createResult.value.id;

        const getResult = await context.security.withoutAuthorization(() =>
            getEntryById.execute(rootModel, entryId)
        );
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.values.title).toBe("Root Entry");

        const subTenant: Tenant = {
            id: "sub-tenant",
            name: "Sub Tenant",
            description: "Sub tenant for isolation test",
            status: "enabled",
            isInstalled: true,
            settings: {},
            tags: [],
            parent: "root",
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString()
        };

        await tenantContext.withTenant(subTenant, async () => {
            const getWrongTenant = await context.security.withoutAuthorization(() =>
                getEntryById.execute(rootModel, entryId)
            );
            expect(getWrongTenant.isFail()).toBe(true);
            expect(getWrongTenant.error.code).toBe("Cms/Entry/NotFound");
        });
    });

    it("should access entries in correct tenant after re-loading model via GetModelUseCase", async () => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const getEntryById = context.container.resolve(GetEntryByIdUseCase);

        const rootModelResult = await context.security.withoutAuthorization(() =>
            getModel.execute(TEST_MODEL_ID)
        );
        expect(rootModelResult.isOk()).toBe(true);
        const rootModel = rootModelResult.value;
        expect(rootModel.tenant).toBe("root");

        const rootCreateResult = await context.security.withoutAuthorization(() =>
            createEntry.execute(rootModel, {
                values: { title: "Root Entry", value: "root-value" }
            })
        );
        expect(rootCreateResult.isOk()).toBe(true);
        const rootEntryId = rootCreateResult.value.id;

        const subTenant: Tenant = {
            id: "sub-tenant",
            name: "Sub Tenant",
            description: "Sub tenant for isolation test",
            status: "enabled",
            isInstalled: true,
            settings: {},
            tags: [],
            parent: "root",
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString()
        };

        await tenantContext.withTenant(subTenant, async () => {
            const subModelResult = await context.security.withoutAuthorization(() =>
                getModel.execute(TEST_MODEL_ID)
            );
            expect(subModelResult.isOk()).toBe(true);
            const subModel = subModelResult.value;
            expect(subModel.tenant).toBe("sub-tenant");

            const subCreateResult = await context.security.withoutAuthorization(() =>
                createEntry.execute(subModel, {
                    values: { title: "Sub Entry", value: "sub-value" }
                })
            );
            expect(subCreateResult.isOk()).toBe(true);
            const subEntryId = subCreateResult.value.id;

            const getSubEntry = await context.security.withoutAuthorization(() =>
                getEntryById.execute(subModel, subEntryId)
            );
            expect(getSubEntry.isOk()).toBe(true);
            expect(getSubEntry.value.values.title).toBe("Sub Entry");

            const getRootFromSub = await context.security.withoutAuthorization(() =>
                getEntryById.execute(subModel, rootEntryId)
            );
            expect(getRootFromSub.isFail()).toBe(true);
            expect(getRootFromSub.error.code).toBe("Cms/Entry/NotFound");
        });

        const getSubFromRoot = await context.security.withoutAuthorization(() =>
            getEntryById.execute(rootModel, rootCreateResult.value.id)
        );
        expect(getSubFromRoot.isOk()).toBe(true);
        expect(getSubFromRoot.value.values.title).toBe("Root Entry");
    });
});
