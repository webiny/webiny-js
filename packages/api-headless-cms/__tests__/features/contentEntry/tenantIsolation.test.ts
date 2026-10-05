import { beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { useHandler } from "~tests/testHelpers/useHandler";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ModelFactory } from "~/features/modelBuilder/index.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
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
                    title: fields.text().label("Title")
                }))
        ];
    }
}

const TestModel = ModelFactory.createImplementation({
    implementation: TestModelImpl,
    dependencies: []
});

const subTenant: Tenant = {
    id: "sub-tenant",
    name: "Sub Tenant",
    description: "Sub tenant for the isolation test",
    status: "enabled",
    isInstalled: true,
    settings: {} as Tenant["settings"],
    tags: [],
    parent: "root",
    createdOn: new Date().toISOString(),
    savedOn: new Date().toISOString()
};

/*
 * The scheduler loads a model, then switches to the tenant it publishes for with
 * `TenantContext.withTenant()`. The model it holds still says `tenant: "root"`, and storage
 * operations key entries by `model.tenant`, so without stamping the current tenant onto the model
 * they read and write the root tenant's entries.
 */
describe("CMS entry tenant isolation", () => {
    let container: Container;

    beforeEach(async () => {
        const { handler } = useHandler({
            plugins: [(c: Container) => c.register(TestModel)]
        });
        ({ container } = (await handler({
            path: "/cms/manage",
            headers: { "x-tenant": "root" }
        })) as { container: Container });
    });

    const asSystem = <T>(cb: () => Promise<T>) =>
        container.resolve(IdentityContext).withoutAuthorization(cb);

    const loadRootModel = async () => {
        const result = await asSystem(() =>
            container.resolve(GetModelUseCase).execute(TEST_MODEL_ID)
        );
        expect(result.isOk()).toBe(true);
        expect(result.value.tenant).toBe("root");
        return result.value;
    };

    it("doesn't find a root tenant entry from another tenant with a model loaded in root", async () => {
        const rootModel = await loadRootModel();

        const created = await asSystem(() =>
            container.resolve(CreateEntryUseCase).execute(rootModel, {
                values: { title: "Root entry" }
            })
        );
        expect(created.isOk()).toBe(true);

        await container.resolve(TenantContext).withTenant(subTenant, async () => {
            const result = await asSystem(() =>
                container.resolve(GetEntryByIdUseCase).execute(rootModel, created.value.id)
            );
            expect(result.isFail()).toBe(true);
        });
    });

    it("writes an entry into the current tenant even with a model loaded in root", async () => {
        const rootModel = await loadRootModel();

        const created = await container.resolve(TenantContext).withTenant(subTenant, () =>
            asSystem(() =>
                container.resolve(CreateEntryUseCase).execute(rootModel, {
                    values: { title: "Sub-tenant entry" }
                })
            )
        );
        expect(created.isOk()).toBe(true);
        expect(created.value.tenant).toBe("sub-tenant");

        // The entry belongs to the sub-tenant, so the root tenant can't see it.
        const fromRoot = await asSystem(() =>
            container.resolve(GetEntryByIdUseCase).execute(rootModel, created.value.id)
        );
        expect(fromRoot.isFail()).toBe(true);

        const fromSubTenant = await container
            .resolve(TenantContext)
            .withTenant(subTenant, () =>
                asSystem(() =>
                    container.resolve(GetEntryByIdUseCase).execute(rootModel, created.value.id)
                )
            );
        expect(fromSubTenant.isOk()).toBe(true);
    });

    it("doesn't read a root tenant revision from another tenant with a model loaded in root", async () => {
        const rootModel = await loadRootModel();

        const created = await asSystem(() =>
            container.resolve(CreateEntryUseCase).execute(rootModel, {
                values: { title: "Root entry" }
            })
        );
        expect(created.isOk()).toBe(true);

        await container.resolve(TenantContext).withTenant(subTenant, async () => {
            const result = await asSystem(() =>
                container.resolve(GetRevisionByIdUseCase).execute(rootModel, created.value.id)
            );
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Cms/Entry/NotFound");
        });
    });

    it("lists only the current tenant's entries with a model loaded in root", async () => {
        const rootModel = await loadRootModel();

        await asSystem(() =>
            container.resolve(CreateEntryUseCase).execute(rootModel, {
                values: { title: "Root entry" }
            })
        );

        await container.resolve(TenantContext).withTenant(subTenant, async () => {
            const result = await asSystem(() =>
                container.resolve(ListLatestEntriesUseCase).execute(rootModel)
            );
            expect(result.isOk()).toBe(true);
            expect(result.value.entries).toEqual([]);
        });
    });

    it("publishes into the current tenant with a model loaded in root", async () => {
        const rootModel = await loadRootModel();

        await container.resolve(TenantContext).withTenant(subTenant, async () => {
            const created = await asSystem(() =>
                container.resolve(CreateEntryUseCase).execute(rootModel, {
                    values: { title: "Sub-tenant entry" }
                })
            );
            expect(created.isOk()).toBe(true);

            const published = await asSystem(() =>
                container.resolve(PublishEntryUseCase).execute(rootModel, created.value.id)
            );
            expect(published.isOk()).toBe(true);
            expect(published.value.tenant).toBe("sub-tenant");
        });
    });
});
