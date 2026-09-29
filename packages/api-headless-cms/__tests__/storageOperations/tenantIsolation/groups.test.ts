import { describe, expect, it, vi } from "vitest";
import { CreateGroupStorageOperation } from "~/features/shared/storageOperations/group/CreateGroupStorageOperation.js";
import { GetGroupStorageOperation } from "~/features/shared/storageOperations/group/GetGroupStorageOperation.js";
import { UpdateGroupStorageOperation } from "~/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { DeleteGroupStorageOperation } from "~/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { ListGroupsStorageOperation } from "~/features/shared/storageOperations/group/ListGroupsStorageOperation.js";
import {
    createIsolationGroup,
    ISOLATION_GROUP_ID,
    TENANT_A,
    TENANT_B,
    useStorageContainer
} from "./helpers";

vi.setConfig({
    testTimeout: 100_000
});

describe("Tenant isolation - groups", () => {
    const getContainer = useStorageContainer();

    it("should update and delete only the tenant's group", async () => {
        const container = getContainer();
        const createGroup = container.resolve(CreateGroupStorageOperation);
        const getGroup = container.resolve(GetGroupStorageOperation);
        const updateGroup = container.resolve(UpdateGroupStorageOperation);
        const deleteGroup = container.resolve(DeleteGroupStorageOperation);

        const groupA = createIsolationGroup(TENANT_A);
        const groupB = createIsolationGroup(TENANT_B);
        await createGroup.execute({ group: groupA });
        await createGroup.execute({ group: groupB });

        await updateGroup.execute({ group: { ...groupA, name: "Changed in A" } });

        const updatedA = await getGroup.execute({ tenant: TENANT_A, id: ISOLATION_GROUP_ID });
        const untouchedB = await getGroup.execute({ tenant: TENANT_B, id: ISOLATION_GROUP_ID });
        expect(updatedA?.name).toEqual("Changed in A");
        expect(untouchedB?.name).toEqual("Isolation Group");

        await deleteGroup.execute({ group: groupA });

        const deletedA = await getGroup.execute({ tenant: TENANT_A, id: ISOLATION_GROUP_ID });
        const remainingB = await getGroup.execute({ tenant: TENANT_B, id: ISOLATION_GROUP_ID });
        expect(deletedA).toBeNull();
        expect(remainingB?.name).toEqual("Isolation Group");
    });

    it("should list only the tenant's groups", async () => {
        const container = getContainer();
        const createGroup = container.resolve(CreateGroupStorageOperation);
        const listGroups = container.resolve(ListGroupsStorageOperation);

        await createGroup.execute({ group: createIsolationGroup(TENANT_A) });
        await createGroup.execute({ group: createIsolationGroup(TENANT_B) });

        const groups = await listGroups.execute({ where: { tenant: TENANT_A } });
        const isolationGroups = groups.filter(group => group.id === ISOLATION_GROUP_ID);
        expect(isolationGroups).toHaveLength(1);
        expect(groups.every(group => group.tenant === TENANT_A)).toBe(true);
    });
});
