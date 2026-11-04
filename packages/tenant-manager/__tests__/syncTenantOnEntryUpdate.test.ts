import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EventPublisherFeature } from "@webiny/api-core/features/eventPublisher/feature.js";
import { UpdateTenantUseCase as ApiCoreUpdateTenant } from "@webiny/api-core/features/tenancy/UpdateTenant";
import { Logger } from "@webiny/api-core/exports/api/logger.js";
import { EntryAfterUpdateEvent } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { SyncTenantOnEntryUpdateFeature } from "~/api/features/SyncTenantOnEntryUpdate/feature.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

const tenantValues = {
    name: "Tenant A",
    description: "First tenant",
    isInstalled: true,
    status: "enabled",
    extensions: {}
};

const createEntry = (values: Record<string, any>) => {
    return { id: "tenant-a#0001", entryId: "tenant-a", values } as any;
};

const createSetup = (updateTenant?: ApiCoreUpdateTenant.Interface) => {
    const calls: Array<{ id: string; data: Record<string, any> }> = [];
    const fakeUpdateTenant: ApiCoreUpdateTenant.Interface = updateTenant ?? {
        execute: async (id, data) => {
            calls.push({ id, data });
            return { isFail: () => false } as any;
        }
    };

    const errors: unknown[][] = [];
    const logger = {
        error: (...args: unknown[]) => errors.push(args)
    } as unknown as Logger.Interface;

    const container = new Container();
    container.registerInstance(Logger, logger);
    container.registerInstance(ApiCoreUpdateTenant, fakeUpdateTenant);
    EventPublisherFeature.register(container);
    SyncTenantOnEntryUpdateFeature.register(container);

    const eventPublisher = container.resolve(EventPublisher);

    const publishUpdate = (
        original: Record<string, any>,
        updated: Record<string, any>,
        modelId = TENANT_MODEL_ID
    ) => {
        return eventPublisher.publish(
            new EntryAfterUpdateEvent({
                entry: createEntry(updated),
                original: createEntry(original),
                input: updated,
                model: { modelId } as any
            })
        );
    };

    return { calls, errors, publishUpdate };
};

describe("Sync tenant on entry update", () => {
    it("should update the api-core tenant name and description when the tenant is renamed", async () => {
        const { calls, publishUpdate } = createSetup();

        await publishUpdate(tenantValues, {
            ...tenantValues,
            name: "Tenant A (renamed)",
            description: "Renamed tenant"
        });

        expect(calls).toEqual([
            {
                id: "tenant-a",
                data: { name: "Tenant A (renamed)", description: "Renamed tenant" }
            }
        ]);
    });

    it("should update the api-core tenant when only the description changes", async () => {
        const { calls, publishUpdate } = createSetup();

        await publishUpdate(tenantValues, { ...tenantValues, description: "New description" });

        expect(calls).toEqual([
            { id: "tenant-a", data: { name: "Tenant A", description: "New description" } }
        ]);
    });

    it("should not update the api-core tenant when only the status changes", async () => {
        const { calls, publishUpdate } = createSetup();

        await publishUpdate(tenantValues, { ...tenantValues, status: "disabled" });

        expect(calls).toEqual([]);
    });

    it("should not update the api-core tenant for entries of other models", async () => {
        const { calls, publishUpdate } = createSetup();

        await publishUpdate(tenantValues, { ...tenantValues, name: "Article" }, "article");

        expect(calls).toEqual([]);
    });

    it("should not fail the entry update when the api-core tenant update fails", async () => {
        const { errors, publishUpdate } = createSetup({
            execute: async () => {
                throw new Error("Storage is down");
            }
        });

        await expect(
            publishUpdate(tenantValues, { ...tenantValues, name: "Tenant A (renamed)" })
        ).resolves.toBeUndefined();

        expect(errors).toEqual([
            [new Error("Storage is down"), "Failed to update tenant tenant-a!"]
        ]);
    });
});
