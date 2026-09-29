import type { Container } from "@webiny/di";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsEntryStatus, CmsGroup, CmsModel } from "~/types";
import { createPersonModel } from "../helpers";
import { createTestEntry } from "../entryFixtures";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";

export const TENANT_A = "isolation-a";
export const TENANT_B = "isolation-b";
export const TENANTS = [TENANT_A, TENANT_B];

export const ISOLATION_MODEL_ID = "isolationModel";
export const ISOLATION_GROUP_ID = "isolationGroup";
export const ISOLATION_ENTRY_ID = "isolationentry";

/**
 * `createPersonModel()` returns `group` as an object, but `CmsModel.group` is a string.
 * better-sqlite3 cannot bind an object, so override `group` and `icon` here.
 */
export const createIsolationModel = (tenant: string): CmsModel => {
    return {
        ...createPersonModel(),
        modelId: ISOLATION_MODEL_ID,
        name: "Isolation Model",
        group: ISOLATION_GROUP_ID,
        icon: null,
        tenant
    };
};

export const createIsolationGroup = (tenant: string): CmsGroup => {
    return {
        id: ISOLATION_GROUP_ID,
        name: "Isolation Group",
        slug: "isolation-group",
        tenant,
        description: null,
        icon: null
    };
};

export const createRevisionId = (version: number): string => {
    return createIdentifier({ id: ISOLATION_ENTRY_ID, version });
};

export interface CreateIsolationEntryParams {
    model: CmsModel;
    version: number;
    status: CmsEntryStatus;
    name?: string;
}

/**
 * Each tenant gets its own values ("<tenant> v<version>"), so a row written into
 * the wrong tenant is visible in the assertions.
 */
export const createIsolationEntry = (params: CreateIsolationEntryParams): CmsEntry => {
    const { model, version, status } = params;
    return createTestEntry({
        model,
        entryId: ISOLATION_ENTRY_ID,
        version,
        status,
        values: {
            name: params.name ?? `${model.tenant} v${version}`
        }
    });
};

/**
 * Same entry id in both tenants: v1 published, v2 draft (latest).
 */
export const createEntryInBothTenants = async (container: Container): Promise<void> => {
    const createEntry = container.resolve(CreateEntryStorageOperation);
    const createRevisionFrom = container.resolve(CreateEntryRevisionFromStorageOperation);
    const publishEntry = container.resolve(PublishEntryStorageOperation);

    for (const tenant of TENANTS) {
        const model = createIsolationModel(tenant);
        const draft = createIsolationEntry({ model, version: 1, status: "draft" });
        await createEntry.execute(model, { entry: draft, storageEntry: draft });
        const published = createIsolationEntry({ model, version: 1, status: "published" });
        await publishEntry.execute(model, { entry: published, storageEntry: published });
        const second = createIsolationEntry({ model, version: 2, status: "draft" });
        await createRevisionFrom.execute(model, { entry: second, storageEntry: second });
    }
};
